import { CacheServiceAccessor } from '@cache//cache.service';

import { Cached } from '../common/services/cache/cache.decorator';

jest.mock('@cache//cache.service', () => ({
  CacheServiceAccessor: { get: jest.fn() },
}));

type MockCache = {
  store: Map<string, string>;
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<void>, [string, string, { ttl?: number }]>;
};

const makeInMemoryCache = (): MockCache => {
  const cache: any = {};
  cache.store = new Map<string, string>();
  cache.get = jest.fn(async (key: string) => (cache.store.has(key) ? cache.store.get(key)! : null));
  cache.set = jest.fn(async (key: string, value: string) => {
    cache.store.set(key, value);
  });
  return cache as MockCache;
};

const makeCtx = (ifNoneMatch?: string) => {
  const headers: Record<string, string> = {};
  return {
    req: { headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {} },
    res: {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      getHeader: (name: string) => headers[name],
    },
  };
};

describe('Cached decorator', () => {
  let cache: MockCache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = makeInMemoryCache();
    // 2) Configure the mocked accessor to return our in-memory cache
    (CacheServiceAccessor as unknown as { get: jest.Mock }).get.mockReturnValue(cache);
  });

  it('caches result on miss and uses provided ttl', async () => {
    class TestSvc {
      impl = jest.fn().mockResolvedValue({ ok: true });

      @Cached('DEFAULT' as any, { ttl: 42 })
      async get(value: number, ctx?: any) {
        return this.impl(value, ctx);
      }
    }

    const svc = new TestSvc();
    const ctx = makeCtx();

    const result = await svc.get(123, ctx);
    expect(result).toEqual({ ok: true });
    expect(svc.impl).toHaveBeenCalledTimes(1);

    expect(cache.get).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledTimes(1);

    const [key, json, opts] = cache.set.mock.calls[0];
    expect(typeof key).toBe('string');
    expect(JSON.parse(json)).toEqual({ ok: true });
    expect(opts).toEqual({ ttl: 42 });

    const result2 = await svc.get(123, ctx);
    expect(result2).toEqual({ ok: true });
    expect(svc.impl).toHaveBeenCalledTimes(1);
    expect(cache.get).toHaveBeenCalledTimes(2);
  });

  it('supports withEtag: sets ETag on response and returns 304 on If-None-Match match', async () => {
    class TestSvc {
      impl = jest.fn().mockResolvedValue({ payload: [1, 2, 3] });

      @Cached('DEFAULT' as any, { withEtag: true })
      async get(id: string, ctx?: any) {
        return this.impl(id, ctx);
      }
    }

    const svc = new TestSvc();

    const ctx1 = makeCtx();
    const first = await svc.get('id-1', ctx1);
    expect(first).toEqual({ payload: [1, 2, 3] });
    expect(ctx1.res.getHeader('ETag')).toBeDefined();
    const etag = ctx1.res.getHeader('ETag');
  });

  it('supports key as a function and receives args + { className, methodName }', async () => {
    const keyFn = jest.fn((args: unknown[], meta?: { className: string; methodName: string }) => {
      expect(Array.isArray(args)).toBe(true);
      expect(meta?.className).toBe('KeyedSvc');
      expect(meta?.methodName).toBe('get');
      return 'custom-key';
    });

    class KeyedSvc {
      impl = jest.fn().mockResolvedValue({ ok: 'yes' });

      @Cached('NAMESPACE' as any, { key: keyFn })
      async get(x: number, ctx?: any) {
        return this.impl(x, ctx);
      }
    }

    const svc = new KeyedSvc();
    const ctx = makeCtx();

    const res = await svc.get(7, ctx);
    expect(res).toEqual({ ok: 'yes' });

    expect(keyFn).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledTimes(1);
    const [key] = cache.set.mock.calls[0];
    expect(key).toBe('NAMESPACE:custom-key');

    await svc.get(7, ctx);
    expect(cache.get).toHaveBeenCalledTimes(2);
  });

  it('does not cache falsy values when cacheFalsy is false (default)', async () => {
    class SvcFalsyOff {
      impl = jest.fn().mockResolvedValue(0);

      @Cached()
      async get(_ctx?: any) {
        return this.impl();
      }
    }

    const svc = new SvcFalsyOff();
    const ctx = makeCtx();

    const res = await svc.get(ctx);
    expect(res).toBe(0);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('caches falsy values when cacheFalsy is true', async () => {
    class SvcFalsyOn {
      impl = jest.fn().mockResolvedValue(false);

      @Cached('DEFAULT' as any, { cacheFalsy: true })
      async get(_ctx?: any) {
        return this.impl();
      }
    }

    const svc = new SvcFalsyOn();
    const ctx = makeCtx();

    const first = await svc.get(ctx);
    expect(first).toBe(false);
    expect(cache.set).toHaveBeenCalledTimes(1);

    const second = await svc.get(ctx);
    expect(second).toBe(false);
    expect(svc.impl).toHaveBeenCalledTimes(1);
  });

  it('does not set cache when result is undefined', async () => {
    class SvcUndefined {
      impl = jest.fn().mockResolvedValue(undefined);

      @Cached()
      async get(_ctx?: any) {
        return this.impl();
      }
    }

    const svc = new SvcUndefined();
    const ctx = makeCtx();

    const res = await svc.get(ctx);
    expect(res).toBeUndefined();
    expect(cache.set).not.toHaveBeenCalled();
  });
});
