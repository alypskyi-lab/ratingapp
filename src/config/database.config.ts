import { Match } from '@app/api/match/match.entity';
import { MatchParticipant } from '@app/api/match/match-participant.entity';
import { Player } from '@app/api/player/player.entity';
import { Rating } from '@app/api/rating/rating.entity';
import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('POSTGRES_HOST'),
  port: Number(config.get<string>('POSTGRES_PORT') || '5432'),
  username: config.get<string>('POSTGRES_USER'),
  password: config.get<string>('POSTGRES_PASSWORD'),
  database: config.get<string>('POSTGRES_DB'),
  entities: [Player, Rating, MatchParticipant, Match],
  synchronize: config.get<string>('POSTGRES_SYNCHRONIZE') === 'true',
});
