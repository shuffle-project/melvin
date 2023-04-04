import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FilterQuery } from 'mongoose';
import { DbService } from '../../modules/db/db.service';
import { LeanActivityDocument } from '../../modules/db/schemas/activity.schema';
import { NotificationDocument } from '../../modules/db/schemas/notification.schema';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { CustomForbiddenException } from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { EventsGateway } from '../events/events.gateway';
import { BulkRemoveDto } from './dto/bulk-delete.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FindAllNotificationsQuery } from './dto/find-all-notifications.dto';
import { UpdateManyNotificationsDto } from './dto/update-many-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationListEntity } from './entities/notification-list.entity';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(private db: DbService, private events: EventsGateway) {}

  async create(
    project: LeanProjectDocument,
    activity: LeanActivityDocument,
  ): Promise<NotificationEntity[]> {
    const usersToNotify = project.users.filter(
      (o) => !isSameObjectId(o, activity.createdBy),
    );

    const notifications = await Promise.all(
      usersToNotify.map((user) => {
        const dto: CreateNotificationDto = {
          user,
          activity: activity._id,
        };

        return this.db.notificationModel.create(dto);
      }),
    );

    // Populate
    const populatedNotifications = await Promise.all(
      notifications.map((o) =>
        o.populate({
          path: 'activity',
          populate: [{ path: 'project' }, { path: 'createdBy', model: 'User' }],
        }),
      ),
    );

    // Entities
    const entities = populatedNotifications.map(
      (o) =>
        plainToInstance(
          NotificationEntity,
          o.toObject(),
        ) as unknown as NotificationEntity,
    );
    // Events
    await Promise.all(entities.map((o) => this.events.notificationCreated(o)));

    return entities;
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllNotificationsQuery,
  ): Promise<NotificationListEntity> {
    if (!isSameObjectId(authUser.id, query.userId)) {
      throw new CustomForbiddenException(
        'cannot_retrieve_notifications_of_other_users',
      );
    }

    const { limit, page = 1, read } = query;
    const skip = limit ? limit * (page - 1) : undefined;

    const filterQuery: FilterQuery<NotificationDocument> = {
      user: query.userId,
      ...(read !== undefined ? { read } : {}),
    };

    const [total, notifications] = await Promise.all([
      this.db.notificationModel.countDocuments(filterQuery),
      this.db.notificationModel
        .find(filterQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'activity',
          populate: [{ path: 'project' }, { path: 'createdBy', model: 'User' }],
        })
        .lean()
        .exec(),
    ]);

    // Entity
    const entity = plainToInstance(NotificationListEntity, {
      notifications,
      total,
      page,
      count: notifications.length,
    });

    return entity;
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = await this.db.notificationModel
      .findOneAndUpdate(
        {
          _id: id,
          user: authUser.id,
        },
        {
          $set: { ...updateNotificationDto },
        },
        {
          new: true,
        },
      )
      .populate({
        path: 'activity',
        populate: [{ path: 'project' }, { path: 'createdBy', model: 'User' }],
      })
      .lean()
      .exec();

    if (notification === null) {
      throw new CustomForbiddenException();
    }

    // Entity
    const entity = plainToInstance(NotificationEntity, notification);

    // Send events
    this.events.notificationsUpdated(authUser.id, [entity]);

    return entity;
  }

  async remove(authUser: AuthUser, id: string): Promise<void> {
    const doc = await this.db.notificationModel
      .findOneAndDelete({
        _id: id,
        user: authUser.id,
      })
      .lean()
      .exec();

    if (doc === null) {
      throw new CustomForbiddenException();
    }

    // Send events
    this.events.notificationsRemoved(authUser.id, [doc._id.toString()]);
  }

  // bulk operations

  async updateMany(
    authUser: AuthUser,
    updateManyNotificationsDto: UpdateManyNotificationsDto,
  ): Promise<NotificationEntity[]> {
    const ids = updateManyNotificationsDto.notifications.map((obj) => obj.id);

    const countDocuments = await this.db.notificationModel.countDocuments({
      _id: { $in: ids },
      user: authUser.id,
    });

    if (countDocuments !== ids.length) {
      throw new CustomForbiddenException();
    }

    const setReadOnTrue = updateManyNotificationsDto.notifications
      .filter((obj) => obj.read)
      .map((obj) => obj.id);
    const setReadOnFalse = updateManyNotificationsDto.notifications
      .filter((obj) => !obj.read)
      .map((obj) => obj.id);

    await Promise.all([
      this.db.notificationModel.updateMany(
        {
          _id: { $in: setReadOnTrue },
          user: authUser.id,
        },
        {
          $set: {
            read: true,
          },
        },
      ),
      this.db.notificationModel.updateMany(
        {
          _id: { $in: setReadOnFalse },
          user: authUser.id,
        },
        {
          $set: {
            read: false,
          },
        },
      ),
    ]);

    const updatedNotifications = await this.db.notificationModel
      .find({
        _id: { $in: ids },
        user: authUser.id,
      })
      .populate({
        path: 'activity',
        populate: [{ path: 'project' }, { path: 'createdBy', model: 'User' }],
      })
      .lean()
      .exec();

    // Entity
    const entities = updatedNotifications.map((obj) =>
      plainToInstance(NotificationEntity, obj),
    );

    // event
    this.events.notificationsUpdated(authUser.id, entities);

    return entities;
  }

  async bulkRemove(
    authUser: AuthUser,
    bulkRemovedDto: BulkRemoveDto,
  ): Promise<void> {
    const count = await this.db.notificationModel.countDocuments({
      _id: { $in: bulkRemovedDto.notificationIds },
      user: authUser.id,
    });

    if (count !== bulkRemovedDto.notificationIds.length) {
      throw new CustomForbiddenException();
    }

    await this.db.notificationModel.deleteMany({
      _id: { $in: bulkRemovedDto.notificationIds },
      user: authUser.id,
    });

    // event
    this.events.notificationsRemoved(
      authUser.id,
      bulkRemovedDto.notificationIds,
    );
  }
}
