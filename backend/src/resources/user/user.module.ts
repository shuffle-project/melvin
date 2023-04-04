import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../../modules/db/db.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DbModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
