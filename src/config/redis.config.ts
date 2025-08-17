import type { ConfigService } from '@nestjs/config';

export const redisConfig = (config: ConfigService) => ({
  host: config.get<string>('REDIS_HOST')!,
  port: parseInt(config.get<string>('REDIS_PORT') || '6379', 10),
});
