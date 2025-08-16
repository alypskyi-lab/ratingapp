import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const mongoConfig = (config: ConfigService): MongooseModuleOptions => ({
    uri: config.get<string>('MONGO_URI')!,
});