import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { DbService } from '../../modules/db/db.service';
import { LeanActivityDocument } from '../../modules/db/schemas/activity.schema';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { CustomForbiddenException } from '../../utils/exceptions';
import { AuthUser } from '../auth/auth.interfaces';
import { NotificationService } from '../notification/notification.service';
import { ActivitiesMap, ActivityAction } from './activity.interfaces';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FindAllActivitiesQuery } from './dto/find-all-activities.dto';
import { ActivityListEntity } from './entities/activity-list.entity';

@Injectable()
export class ActivityService {
  constructor(
    private db: DbService,
    private permissions: PermissionsService,
    private notificationService: NotificationService,
  ) {}

  async create<Action extends ActivityAction>(
    project: LeanProjectDocument,
    createdBy: string,
    action: Action,
    details: ActivitiesMap[Action],
  ): Promise<LeanActivityDocument> {
    const dto: CreateActivityDto = {
      createdBy: new Types.ObjectId(createdBy),
      project: project._id,
      action,
      details,
    };

    const doc = await this.db.activityModel.create(dto);

    const activity = doc.toObject() as LeanActivityDocument;

    await this.notificationService.create(project, activity);

    return activity;
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllActivitiesQuery,
  ): Promise<ActivityListEntity> {
    const project = await this.db.findProjectByIdOrThrow(query.projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('must_be_project_member');
    }

    const { limit, page = 1 } = query;
    const skip = limit ? limit * (page - 1) : undefined;

    const [total, activities] = await Promise.all([
      this.db.activityModel.countDocuments({
        project: query.projectId,
      }),
      this.db.activityModel
        .find({
          project: query.projectId,
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate([{ path: 'project' }, { path: 'createdBy', model: 'User' }])
        .lean()
        .exec(),
    ]);

    // Entity
    const entity = plainToInstance(ActivityListEntity, {
      activities,
      total,
      page,
      count: activities.length,
    });

    return entity;
  }
}
