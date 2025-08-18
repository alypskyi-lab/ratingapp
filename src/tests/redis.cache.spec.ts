import { Logger } from '@nestjs/common';

import { RedisCacheService } from '../common/services/cache/cache.service';

type FakeRedis = {
  on: jest.Mock;
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<string>, any>;
  scan: jest.Mock<Promise<[string, string[]]>, [string, 'MATCH', string, 'COUNT', number]>;
  unlink: jest.Mock<Promise<number>, string[]>;
  del: jest.Mock<Promise<number>, string[]>;
  quit: jest.Mock<Promise<void>, []>;
};

const createFakeRedis = (): FakeRedis => ({
  on: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  scan: jest.fn().mockResolvedValue(['0', []]),
  unlink: jest.fn().mockResolvedValue(0),
  del: jest.fn().mockResolvedValue(0),
  quit: jest.fn().mockResolvedValue(undefined),
});

describe('RedisCacheService', () => {
  let redis: FakeRedis;
  let service: RedisCacheService;

  const silenceLogger = () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  };

  beforeEach(() => {
    jest.clearAllMocks();
    silenceLogger();
    redis = createFakeRedis();
    service = new RedisCacheService(redis as any);
  });

  describe('constructor', () => {
    it('registers event listeners for error, connect, reconnecting', () => {
      const events = redis.on.mock.calls.map(([evt]) => evt);
      expect(events).toEqual(expect.arrayContaining(['error', 'connect', 'reconnecting']));
    });

    it('event handlers do not throw', () => {
      const findCb = (evt: string) =>
        redis.on.mock.calls.find(([e]) => e === evt)?.[1] as ((...args: any[]) => void) | undefined;

      const errorCb = findCb('error');
      const connectCb = findCb('connect');
      const reconnectingCb = findCb('reconnecting');

      expect(() => errorCb && errorCb(new Error('boom'))).not.toThrow();
      expect(() => connectCb && connectCb()).not.toThrow();
      expect(() => reconnectingCb && reconnectingCb()).not.toThrow();
    });
  });

  describe('get', () => {
    it('delegates to redis.get and returns its value', async () => {
      redis.get.mockResolvedValueOnce('v1');
      const v = await service.get('k1');
      expect(v).toBe('v1');
      expect(redis.get).toHaveBeenCalledWith('k1');
    });
  });

  describe('set', () => {
    it('sets without ttl/nx/xx', async () => {
      await service.set('k', 'v');
      expect(redis.set).toHaveBeenCalledWith('k', 'v');
    });

    it('includes EX when ttl > 0', async () => {
      await service.set('k', 'v', { ttl: 10 });
      expect(redis.set).toHaveBeenCalledWith('k', 'v', 'EX', '10');
    });

    it('includes NX when nx is true', async () => {
      await service.set('k', 'v', { nx: true });
      const args = redis.set.mock.calls.at(-1)!;
      expect(args).toEqual(['k', 'v', 'NX']);
    });

    it('includes XX when xx is true', async () => {
      await service.set('k', 'v', { xx: true });
      const args = redis.set.mock.calls.at(-1)!;
      expect(args).toEqual(['k', 'v', 'XX']);
    });

    it('throws when both nx and xx are true', async () => {
      await expect(service.set('k', 'v', { nx: true, xx: true })).rejects.toThrow('NX and XX are mutually exclusive');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('warns when response is not OK and no nx/xx were used', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      redis.set.mockResolvedValueOnce('NOPE');
      await service.set('keyX', 'v');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SET returned non-OK for key=keyX'));
    });
  });

  describe('invalidate', () => {
    it('scans and unlinks matching keys', async () => {
      // One scan iteration returning keys, then cursor ends.
      redis.scan.mockResolvedValueOnce(['0', ['ns:a', 'ns:b']]);

      await service.invalidate('ns:' as any);

      expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'ns:', 'COUNT', 1000);
      expect(redis.unlink).toHaveBeenCalledTimes(1);
      // unlink receives variadic args (...keys). We only verify it contains both keys.
      const unlinkArgs = redis.unlink.mock.calls[0];
      expect(unlinkArgs).toEqual(['ns:a', 'ns:b']);
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('falls back to DEL when UNLINK rejects', async () => {
      redis.scan.mockResolvedValueOnce(['0', ['ns:x']]);

      redis.unlink.mockRejectedValueOnce(new Error('unlink not supported'));

      await service.invalidate('ns:' as any);

      expect(redis.del).toHaveBeenCalledWith('ns:x');
    });

    it('handles multiple SCAN pages', async () => {
      // Two pages: first returns cursor '42' with keys, second ends with '0'
      redis.scan.mockResolvedValueOnce(['42', ['ns:1', 'ns:2']]).mockResolvedValueOnce(['0', ['ns:3']]);

      await service.invalidate('ns:' as any);

      expect(redis.scan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'ns:', 'COUNT', 1000);
      expect(redis.scan).toHaveBeenNthCalledWith(2, '42', 'MATCH', 'ns:', 'COUNT', 1000);
      expect(redis.unlink).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('calls redis.quit()', async () => {
      await service.onModuleDestroy();
      expect(redis.quit).toHaveBeenCalledTimes(1);
    });

    it('logs a warning if quit() throws', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      redis.quit.mockRejectedValueOnce(new Error('fail'));
      await service.onModuleDestroy();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error during Redis shutdown: fail'));
    });
  });
});
