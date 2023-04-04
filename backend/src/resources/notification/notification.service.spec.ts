import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanActivityDocument } from '../../modules/db/schemas/activity.schema';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { UserDocument } from '../../modules/db/schemas/user.schema';
import { CustomForbiddenException } from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { EventsGateway } from '../events/events.gateway';
import { BulkRemoveDto } from './dto/bulk-delete.dto';
import { FindAllNotificationsQuery } from './dto/find-all-notifications.dto';
import { UpdateManyNotificationsDto } from './dto/update-many-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationListEntity } from './entities/notification-list.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationModule } from './notification.module';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: NotificationService;
  let dbService: DbService;

  const eventsGateway = {
    notificationCreated: jest.fn(),
    notificationsUpdated: jest.fn(),
    notificationsRemoved: jest.fn(),
  };

  let predefinedUser: UserDocument;
  let authUser: AuthUser;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, NotificationModule],
    })
      .overrideProvider(EventsGateway)
      .useValue(eventsGateway)
      .compile();

    service = module.get<NotificationService>(NotificationService);
    dbService = module.get<DbService>(DbService);

    // Setup
    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    authUser = {
      id: predefinedUser._id.toString(),
      role: predefinedUser.role,
    };
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should verify', async () => {
    // Setup
    const [createdBy, userA, userB] = await dbService.userModel.insertMany([
      {},
      {},
      {},
    ]);

    const project: LeanProjectDocument = await dbService.projectModel.create({
      users: [createdBy._id, userA._id, userB._id],
    });
    const activity: LeanActivityDocument = await dbService.activityModel.create(
      {
        project: project._id,
        createdBy: createdBy._id,
      },
    );

    // Test
    const notifications = await service.create(project, activity);

    expect(eventsGateway.notificationCreated).toBeCalledTimes(2);
    expect(eventsGateway.notificationCreated).nthCalledWith(
      1,
      notifications[0],
    );
    expect(eventsGateway.notificationCreated).nthCalledWith(
      2,
      notifications[1],
    );

    expect(notifications.length).toBe(2);
    expect(notifications[0]).toMatchObject({
      user: userA._id,
      read: false,
      activity: {
        _id: activity._id,
      },
    });
    expect(notifications[1]).toMatchObject({
      user: userB._id,
      read: false,
      activity: {
        _id: activity._id,
      },
    });
  });

  it('findAll() should verify', async () => {
    // Setup
    const project = await dbService.projectModel.create({});
    const activity = await dbService.activityModel.create({
      project: project._id,
    });
    await dbService.notificationModel.insertMany([
      {
        user: new Types.ObjectId(),
        activity: activity._id,
      },
      {
        user: predefinedUser._id,
        activity: activity._id,
      },
      {
        user: new Types.ObjectId(),
        activity: activity._id,
      },
    ]);
    const notification = await dbService.notificationModel.create({
      user: predefinedUser._id,
      activity: activity._id,
    });

    // Test
    const result = await service.findAll(authUser, {
      userId: predefinedUser._id.toString(),
      limit: 1,
    });
    const doc = await dbService.notificationModel
      .findById(notification._id)
      .populate({
        path: 'activity',
        populate: [{ path: 'project' }, { path: 'createdBy', model: 'User' }],
      })
      .lean()
      .exec();

    expect(result).toEqual(
      plainToInstance(NotificationListEntity, {
        notifications: [doc],
        total: 2,
        page: 1,
        count: 1,
      }),
    );
  });

  it('findAll() with invalid auth-user should fail', async () => {
    // Setup
    const query: FindAllNotificationsQuery = {
      userId: new Types.ObjectId().toString(),
    };

    // Test
    let error: CustomForbiddenException;
    try {
      await service.findAll(authUser, query);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('cannot_retrieve_notifications_of_other_users');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('update() should verify', async () => {
    // Setup
    const notification = await dbService.notificationModel.create({
      user: predefinedUser._id,
    });
    const dto: UpdateNotificationDto = {
      read: true,
    };

    // Test
    const entity = await service.update(authUser, notification._id, dto);

    expect(eventsGateway.notificationsUpdated).toBeCalledTimes(1);
    expect(eventsGateway.notificationsUpdated).toBeCalledWith(
      predefinedUser._id.toString(),
      [entity],
    );
    expect(entity).toEqual({
      ...plainToInstance(NotificationEntity, notification.toObject()),
      updatedAt: entity.updatedAt,
      read: true,
    });
  });

  it('update() with invalid auth-user should fail', async () => {
    // Setup
    const notification = await dbService.notificationModel.create({
      user: new Types.ObjectId(),
    });
    const dto: UpdateNotificationDto = {
      read: true,
    };

    // Test
    let error: CustomForbiddenException;
    try {
      await service.update(authUser, notification._id, dto);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('forbidden');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('remove() should verify', async () => {
    // Setup
    const notification = await dbService.notificationModel.create({
      user: predefinedUser._id,
    });

    // Test
    await service.remove(authUser, notification._id.toString());

    const notificationsCount =
      await dbService.notificationModel.countDocuments();
    expect(eventsGateway.notificationsRemoved).toBeCalledTimes(1);
    expect(eventsGateway.notificationsRemoved).toBeCalledWith(authUser.id, [
      notification._id,
    ]);
    expect(notificationsCount).toBe(0);
  });

  it('remove() with invalid auth-user should fail', async () => {
    // Setup
    const notification = await dbService.notificationModel.create({
      user: new Types.ObjectId(),
    });

    // Test
    let error: CustomForbiddenException;
    try {
      await service.remove(authUser, notification._id);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('forbidden');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('updateMany() should verify', async () => {
    // Setup
    const notifications = await dbService.notificationModel.insertMany([
      {
        user: predefinedUser._id,
        read: true,
      },
      {
        user: predefinedUser._id,
        read: true,
      },
      {
        user: predefinedUser._id,
        read: false,
      },
    ]);
    const notificationIds = notifications.map((obj) => obj._id.toString());

    const dto: UpdateManyNotificationsDto = {
      notifications: [
        { id: notificationIds[0], read: false },
        { id: notificationIds[1], read: false },
        { id: notificationIds[2], read: true },
      ],
    };

    // Test
    const result = await service.updateMany(authUser, dto);

    expect(result).toHaveLength(3);
    dto.notifications.forEach((notification) => {
      expect(
        result.some(
          (obj) =>
            isSameObjectId(obj._id, notification.id) &&
            obj.read === notification.read,
        ),
      );
    });

    expect(eventsGateway.notificationsUpdated).toBeCalledWith(
      authUser.id,
      expect.anything(),
    );
  });

  it('bulkRemove() should verify', async () => {
    // Setup
    const notifications = await dbService.notificationModel.insertMany([
      { user: predefinedUser._id },
      { user: predefinedUser._id },
      { user: predefinedUser._id },
    ]);
    const notificationIds = notifications.map((obj) => obj._id.toString());

    const bulkRemoveDto: BulkRemoveDto = {
      notificationIds,
    };

    //Test
    await service.bulkRemove(authUser, bulkRemoveDto);

    const countAfter = await dbService.notificationModel.countDocuments();
    expect(countAfter).toBe(0);
    expect(eventsGateway.notificationsRemoved).toBeCalledWith(
      authUser.id,
      notificationIds,
    );
  });

  it('bulkRemove() should be forbidden', async () => {
    // Setup
    const notifications = await dbService.notificationModel.insertMany([
      { user: predefinedUser._id },
      { user: predefinedUser._id },
      { user: predefinedUser._id },
    ]);
    const notificationIds = notifications.map((obj) => obj._id.toString());

    notificationIds.push(TEST_DATA.validObjectId); // add valid but not inserted objectid

    const bulkRemoveDto: BulkRemoveDto = {
      notificationIds,
    };

    //Test
    let error: any;
    try {
      await service.bulkRemove(authUser, bulkRemoveDto);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(403);
    expect(error.code).toBe('forbidden');
  });
});
