import { computeETag } from '@common/http/etag.util';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';

import { CacheNamespace } from '../../enums/cache.namespace.enum';
import { CacheServiceAccessor } from './cache.service';

export type RedisCacheDecoratorOptions = {
  key?: string | ((args: unknown[], context?: { className: string; methodName: string }) => string);
  // TTL in seconds. Default: 300
  ttl?: number;
  cacheFalsy?: boolean;
  withEtag?: boolean; // if true, attach ETag header and handle 304
};

export function Cached(
  namespace: CacheNamespace = CacheNamespace.DEFAULT,
  options: RedisCacheDecoratorOptions = {},
): MethodDecorator {
  const logger = new Logger('RedisCached');
  const { ttl = 300, cacheFalsy = false, withEtag = false } = options;

  return (_target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: any[]) => Promise<any>;

    descriptor.value = async function (...args: any[]) {
      const cache = CacheServiceAccessor.get();
      const className = this?.constructor?.name ?? 'Anonymous';
      const methodName = String(propertyKey);

      const baseKey =
        typeof options.key === 'function'
          ? options.key(args, { className, methodName })
          : (options.key ?? `${className}:${methodName}:${sha1Safe(args)}`);

      const key = `${namespace}:${baseKey}`;
      logger.debug(`Redis key=${key}`);

      const ctx: any = args[args.length - 1]; // last arg often contains Nest execution context
      const res: any = ctx?.res ?? ctx?.response; // try to extract response object if passed
      const req: any = ctx?.req ?? ctx?.request;

      try {
        const hit = await cache.get(key);
        if (hit != null) {
          const parsed = JSON.parse(hit);
          if (withEtag && res) {
            const etag = computeETag(parsed);
            res.setHeader?.('ETag', etag);
            const ifNoneMatch = req?.headers?.['if-none-match'];
            if (ifNoneMatch && ifNoneMatch === etag) {
              res.status(304).end();
              return undefined;
            }
          }
          return parsed;
        }
      } catch (err) {
        logger.warn(`Redis get failed for key=${key}: ${(err as Error).message}`);
      }

      const result = await original.apply(this, args);
      if (!cacheFalsy && !result) return result;

      try {
        if (result !== undefined) await cache.set(key, JSON.stringify(result), { ttl });
      } catch (err) {
        logger.warn(`Redis set failed for key=${key}: ${(err as Error).message}`);
      }

      if (withEtag && res) {
        try {
          const etag = computeETag(result);
          res.setHeader?.('ETag', etag);
        } catch {}
      }

      return result;
    };

    return descriptor;
  };
}

function sha1Safe(value: unknown): string {
  try {
    const json = JSON.stringify(value, jsonSafeReplacer);
    return createHash('sha1').update(json).digest('hex');
  } catch {
    return createHash('sha1').update(String(value)).digest('hex');
  }
}

function jsonSafeReplacer(_key: string, val: unknown): unknown {
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Map) return Object.fromEntries(val);
  if (val instanceof Set) return Array.from(val);
  return val;
}
