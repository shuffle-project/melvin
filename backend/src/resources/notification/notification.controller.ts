import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BulkRemoveDto } from './dto/bulk-delete.dto';
import { FindAllNotificationsQuery } from './dto/find-all-notifications.dto';
import { UpdateManyNotificationsDto } from './dto/update-many-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationListEntity } from './entities/notification-list.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationService } from './notification.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: NotificationListEntity })
  findAll(
    @User() authUser: AuthUser,
    @Query() query: FindAllNotificationsQuery,
  ): Promise<NotificationListEntity> {
    return this.notificationService.findAll(authUser, query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, type: NotificationEntity })
  update(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) notificationId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationEntity> {
    return this.notificationService.update(
      authUser,
      notificationId,
      updateNotificationDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  remove(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) notificationId: string,
  ): Promise<void> {
    return this.notificationService.remove(authUser, notificationId);
  }

  // bulk operations

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiResponse({ status: HttpStatus.OK, type: UpdateManyNotificationsDto })
  updateMany(
    @User() authUser: AuthUser,
    @Body() updateManyNotificationsDto: UpdateManyNotificationsDto,
  ): Promise<NotificationEntity[]> {
    return this.notificationService.updateMany(
      authUser,
      updateManyNotificationsDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-remove')
  bulkRemove(
    @User() authUser: AuthUser,
    @Body() bulkRemoveDto: BulkRemoveDto,
  ): Promise<void> {
    return this.notificationService.bulkRemove(authUser, bulkRemoveDto);
  }
}
