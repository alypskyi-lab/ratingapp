import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { CacheNamespace } from '../../enums/cache.namespace.enum';
import {REDIS_CLIENT} from "@common/constants";

type CacheSetOptions = {
    ttl?: number; // seconds
    nx?: boolean;
    xx?: boolean;
};

// A tiny accessor to make the cache service callable from decorators.
export class CacheServiceAccessor {
    private static instance: RedisCacheService | null = null;

    static set(instance: RedisCacheService) {
        this.instance = instance;
    }

    static get(): RedisCacheService {
        if (!this.instance) {
            throw new Error('RedisCacheService is not initialized yet.');
        }
        return this.instance;
    }
}

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisCacheService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
        this.redis.on('error', (err) => this.logger.error(`[Cache] Redis error: ${err.message}`));
        this.redis.on('connect', () => this.logger.log('[Cache] Redis connected'));
        this.redis.on('reconnecting', () => this.logger.warn('[Cache] Redis reconnecting...'));

        // Make the service accessible to method decorators
        CacheServiceAccessor.set(this);
    }

    public async onModuleDestroy(): Promise<void> {
        try {
            await this.redis.quit();
        } catch (err) {
            this.logger.warn(`Error during Redis shutdown: ${(err as Error).message}`);
        }
    }

    public async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    // Basic KV
    public async set(key: string, value: string | number, opts: CacheSetOptions = {}): Promise<void> {
        const args: (string | number)[] = [key, String(value)];

        if (opts.ttl && opts.ttl > 0) {
            args.push('EX', String(opts.ttl));
        }
        if (opts.nx && opts.xx) {
            throw new Error('NX and XX are mutually exclusive');
        }
        if (opts.nx) args.push('NX');
        if (opts.xx) args.push('XX');

        const res = await (this.redis as any).set(...args);
        if (res !== 'OK' && !opts.nx && !opts.xx) {
            this.logger.warn(`SET returned non-OK for key=${key}`);
        }
    }

    // Removes all cache entries for a given namespace.
    async invalidate(namespace: CacheNamespace): Promise<void> {
        return this.clearCache(`${namespace}`);
    }

    private async clearCache(pattern: string): Promise<void> {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
            cursor = nextCursor;

            if (keys.length) {
                for (const chunk of this.chunkArray(keys, 1000)) {
                    try {
                        await (this.redis as any).unlink(...chunk);
                    } catch {
                        await (this.redis as any).del(...chunk);
                    }
                }
            }
        } while (cursor !== '0');
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    }
}
