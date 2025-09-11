import { Module } from '@nestjs/common';
import { DbModule } from 'src/modules/db/db.module';
import { PathModule } from 'src/modules/path/path.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  imports: [DbModule, PathModule, AuthModule, UserModule],
  providers: [AdminService],
})
export class AdminModule {}
