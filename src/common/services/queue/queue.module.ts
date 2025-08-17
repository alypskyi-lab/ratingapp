import { RATING_QUEUE } from '@common/constants';
import { redisConfig } from '@config/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ connection: redisConfig(cfg) }),
    }),
    BullModule.registerQueue({ name: RATING_QUEUE }),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueInfraModule {}
