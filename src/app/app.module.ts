import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Player } from '@entities/player.entity';
import { Rating } from '@entities/rating.entity';
import { typeOrmConfig } from '@config/database.config';
import { redisConfig } from '@config/redis.config';
import { PlayerController } from '@app/player/player.controller';
import { PlayersService } from '@app/player/player.service';
import { RATING_QUEUE } from '@common/constants';
import { RequestContextMiddleware } from '@common/http/request-context.middleware';
import {CacheModule} from "@cache//cache.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: typeOrmConfig }),
        TypeOrmModule.forFeature([Player, Rating]),
        BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (cfg: ConfigService) => ({ connection: redisConfig(cfg) }) }),
        BullModule.registerQueue({ name: RATING_QUEUE }),
        CacheModule
    ],
    controllers: [PlayerController],
    providers: [PlayersService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) { consumer.apply(RequestContextMiddleware).forRoutes('*'); }
}
