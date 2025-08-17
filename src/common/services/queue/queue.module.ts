import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import {redisConfig} from "@config/redis.config";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {RATING_QUEUE} from "@common/constants";

@Module({
    imports: [
        BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (cfg: ConfigService) => ({ connection: redisConfig(cfg) }) }),
        BullModule.registerQueue(
            { name: RATING_QUEUE },
        ),
    ],
    providers: [QueueService],
    exports: [QueueService, BullModule]
})
export class QueueInfraModule {}