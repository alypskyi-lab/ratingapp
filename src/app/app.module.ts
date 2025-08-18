import { MatchController } from '@app/api/match/match.controller';
import { Match } from '@app/api/match/match.entity';
import { MatchService } from '@app/api/match/match.service';
import { MatchParticipant } from '@app/api/match/match-participant.entity';
import { PlayerController } from '@app/api/player/player.controller';
import { Player } from '@app/api/player/player.entity';
import { PlayersService } from '@app/api/player/player.service';
import { LeaderboardController } from '@app/api/rating/rating.controller';
import { Rating } from '@app/api/rating/rating.entity';
import { RatingService } from '@app/api/rating/rating.service';
import { RatingsProcessor } from '@app/processors/rating/rating.processor';
import { CacheModule } from '@cache//cache.module';
import { RequestContextMiddleware } from '@common/http/request-context.middleware';
import { QueueInfraModule } from '@common/services/queue/queue.module';
import { typeOrmConfig } from '@config/database.config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: typeOrmConfig }),
    TypeOrmModule.forFeature([Player, Rating, MatchParticipant, Match]),
    QueueInfraModule,
    CacheModule,
  ],
  controllers: [PlayerController, MatchController, LeaderboardController],
  providers: [PlayersService, MatchService, RatingsProcessor, RatingService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
