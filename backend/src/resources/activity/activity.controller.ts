import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { FindAllActivitiesQuery } from './dto/find-all-activities.dto';
import { ActivityListEntity } from './entities/activity-list.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('activities')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: ActivityListEntity })
  findAll(
    @User() authUser: AuthUser,
    @Query() query: FindAllActivitiesQuery,
  ): Promise<ActivityListEntity> {
    return this.activityService.findAll(authUser, query);
  }
}
