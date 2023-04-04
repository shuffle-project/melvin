import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
