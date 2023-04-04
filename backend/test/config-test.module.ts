import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../src/config/config.load';

export const ConfigTestModule: DynamicModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
});
