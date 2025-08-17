import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Player } from '@app/api/player/player.entity';
import { Rating } from '@app/processors/rating/rating.entity';
import { typeOrmConfig } from '@config/database.config';
import { redisConfig } from '@config/redis.config';
import { PlayerController } from '@app/api/player/player.controller';
import { PlayersService } from '@app/api/player/player.service';
import { RATING_QUEUE } from '@common/constants';
import { RequestContextMiddleware } from '@common/http/request-context.middleware';
import {CacheModule} from "@cache//cache.module";
import {MatchController} from "@app/api/match/match.controller";
import {MatchService} from "@app/api/match/match.service";
import {MatchParticipant} from "@app/api/match/match-participant.entity";
import {Match} from "@app/api/match/match.entity";
import {RatingsProcessor} from "@app/processors/rating/rating.processor";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: typeOrmConfig }),
        TypeOrmModule.forFeature([Player, Rating, MatchParticipant, Match]),
        BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (cfg: ConfigService) => ({ connection: redisConfig(cfg) }) }),
        BullModule.registerQueue({ name: RATING_QUEUE }),
        CacheModule
    ],
    controllers: [PlayerController, MatchController],
    providers: [PlayersService, MatchService, RatingsProcessor],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) { consumer.apply(RequestContextMiddleware).forRoutes('*'); }
}
