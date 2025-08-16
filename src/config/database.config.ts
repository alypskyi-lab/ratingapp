import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Player } from '@entities/player.entity';
import { Rating } from '@entities/rating.entity';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: config.get<string>('POSTGRES_HOST'),
    port: Number(config.get<string>('POSTGRES_PORT') || '5432'),
    username: config.get<string>('POSTGRES_USER'),
    password: config.get<string>('POSTGRES_PASSWORD'),
    database: config.get<string>('POSTGRES_DB'),
    entities: [Player, Rating],
    synchronize: config.get<string>('POSTGRES_SYNCHRONIZE') === 'true',
});