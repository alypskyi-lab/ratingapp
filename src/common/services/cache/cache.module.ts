import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisCacheService } from './cache.service';
import { redisConfig } from '@config/redis.config';
import { REDIS_CLIENT } from "@common/constants";

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => {
                const options = redisConfig(cfg); // must return ioredis connection options or a connection string
                return new Redis(options as any);
            },
        },
        RedisCacheService,
    ],
    exports: [RedisCacheService, REDIS_CLIENT],
})
export class CacheModule {}
