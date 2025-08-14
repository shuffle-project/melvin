import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../../modules/db/db.module';
import { PathModule } from '../../modules/path/path.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DbModule, ConfigModule, PathModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
