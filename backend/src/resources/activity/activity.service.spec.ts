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
import {
  LeanProjectDocument,
  ProjectStatus,
} from '../../modules/db/schemas/project.schema';
import { UserDocument } from '../../modules/db/schemas/user.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from '../../utils/exceptions';
import { AuthUser } from '../auth/auth.interfaces';
import { NotificationService } from '../notification/notification.service';
import { ActivityAction, ActivityDetails } from './activity.interfaces';
import { ActivityModule } from './activity.module';
import { ActivityService } from './activity.service';
import { FindAllActivitiesQuery } from './dto/find-all-activities.dto';
import { ActivityListEntity } from './entities/activity-list.entity';

describe('ActivityService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: ActivityService;
  let dbService: DbService;
  let permissionsService: PermissionsService;

  let predefinedUser: UserDocument;
  let authUser: AuthUser;

  const notificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, ActivityModule],
    })
      .overrideProvider(NotificationService)
      .useValue(notificationService)
      .compile();

    service = module.get<ActivityService>(ActivityService);
    dbService = module.get<DbService>(DbService);
    permissionsService = module.get<PermissionsService>(PermissionsService);

    // Setup
    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    authUser = {
      id: predefinedUser._id.toString(),
      role: predefinedUser.role,
      jwtId: new Types.ObjectId().toString(),
    };
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(service).toBeDefined();
  });

  it('create() should verify', async () => {
    // Setup
    const createdBy = new Types.ObjectId().toString();
    const project: LeanProjectDocument = new dbService.projectModel({});
    const action: ActivityAction = 'project-status-updated';
    const details: ActivityDetails = {
      statusBefore: ProjectStatus.DRAFT,
      statusAfter: ProjectStatus.FINISHED,
    };

    // Test
    const activity = await service.create(project, createdBy, action, details);

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(project, activity);

    expect({
      project: activity.project,
      createdBy: activity.createdBy.toString(),
      action: activity.action,
      details: activity.details,
    }).toEqual({
      project: project._id,
      createdBy,
      action,
      details,
    });
  });

  it('findAll() should verify', async () => {
    // Setup
    const project = await dbService.projectModel.create({
      users: [predefinedUser._id],
    });
    await Promise.all([
      dbService.activityModel.create({}),
      dbService.activityModel.create({
        project: project._id,
        action: 'project-created',
      }),
      dbService.activityModel.create({}),
    ]);

    const activity = await dbService.activityModel.create({
      project: project._id,
      action: 'project-status-updated',
    });

    const spy_findProjectByIdOrThrow = jest.spyOn(
      dbService,
      'findProjectByIdOrThrow',
    );

    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    // Test
    const result = await service.findAll(authUser, {
      projectId: project._id.toString(),
      limit: 1,
    });
    const doc = await dbService.activityModel
      .findById(activity._id)
      .populate('project', 'createdBy')
      .lean()
      .exec();

    expect(spy_findProjectByIdOrThrow).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);

    expect(result).toEqual(
      plainToInstance(ActivityListEntity, {
        activities: [doc],
        total: 2,
        page: 1,
        count: 1,
      }),
    );
  });

  it('findAll() with unknown projectId should fail', async () => {
    // Setup
    const query: FindAllActivitiesQuery = {
      projectId: new Types.ObjectId().toString(),
    };

    // Test
    let error: CustomBadRequestException;
    try {
      await service.findAll(authUser, query);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_project_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('findAll() without project permission should fail', async () => {
    // Setup
    const project = await dbService.projectModel.create({});
    const query: FindAllActivitiesQuery = {
      projectId: project._id.toString(),
    };

    // Test
    let error: CustomBadRequestException;
    try {
      await service.findAll(authUser, query);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });
});
