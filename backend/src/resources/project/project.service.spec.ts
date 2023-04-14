import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { instanceToPlain } from 'class-transformer';
import { Types } from 'mongoose';
import { UserDocument } from 'src/modules/db/schemas/user.schema';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_USER,
  MEDIA_ACCESS_TOKEN,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { ProjectStatus } from '../../modules/db/schemas/project.schema';
import { MailService } from '../../modules/mail/mail.service';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectModule } from './project.module';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: ProjectService;
  let dbService: DbService;
  let permissionsService: PermissionsService;
  let mailService: MailService;
  let authService: AuthService;

  const eventsGateway = {
    projectCreated: jest.fn(),
    projectUpdated: jest.fn(),
    projectRemoved: jest.fn(),
    joinProjectRoom: jest.fn(),
    leaveProjectRoom: jest.fn(),
    transcriptionCreated: jest.fn(),
  };
  const activityService = {
    create: jest.fn(),
  };
  const projectQueue = {
    add: jest.fn(),
  };

  let predefinedUser: UserDocument;
  let authUser: AuthUser;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, ProjectModule],
    })
      .overrideProvider(EventsGateway)
      .useValue(eventsGateway)
      .overrideProvider(ActivityService)
      .useValue(activityService)
      .overrideProvider(getQueueToken('project'))
      .useValue(projectQueue)
      .compile();

    service = module.get<ProjectService>(ProjectService);
    dbService = module.get<DbService>(DbService);
    permissionsService = module.get<PermissionsService>(PermissionsService);
    mailService = module.get<MailService>(MailService);
    authService = module.get<AuthService>(AuthService);

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
    // Test
    expect(service).not.toBeDefined();
  });

  it('_getMediaLinksEntity should verify', async () => {
    // Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: TEST_DATA.validObjectId,
    });
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: proj1._id },
    });

    const spy_createMediaAccessToken = jest
      .spyOn(authService, 'createMediaAccessToken')
      .mockImplementation(() =>
        Promise.resolve({
          token: MEDIA_ACCESS_TOKEN,
        }),
      );

    // Test
    const result = await service._getMediaLinksEntity(proj1, authUser);

    expect(spy_createMediaAccessToken).toBeCalledTimes(1);
    expect(result.video).toContain(
      `/projects/${proj1._id.toString()}/media/video?Authorization=${MEDIA_ACCESS_TOKEN}`,
    );
  });

  it('create() should verify', async () => {
    //Setup
    const createProjectDto: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      sourceMode: 'video',
    };

    const spy_handleFilesAndTranscriptions = jest
      .spyOn(service, '_handleFilesAndTranscriptions')
      .mockImplementation(() => Promise.resolve());

    //Test
    const response = await service.create(authUser, createProjectDto);
    const entity = instanceToPlain(response);

    const project = await dbService.projectModel
      .findOne({
        title: TEST_DATA.project.title,
      })
      .lean()
      .exec();

    delete createProjectDto.sourceMode;
    expect(entity).toEqual(
      expect.objectContaining({
        ...createProjectDto,
        status: ProjectStatus.WAITING,
        id: project._id.toString(),
        createdBy: authUser.id,
        users: [
          {
            id: predefinedUser._id.toString(),
            email: predefinedUser.email,
            role: predefinedUser.role,
          },
        ],
      }),
    );

    const user = await dbService.userModel.findById(predefinedUser._id);
    const projectIds: string[] = (user.projects as Types.ObjectId[]).map(
      (item: Types.ObjectId) => item.toString(),
    );
    expect(projectIds).toContain(project._id.toString());

    expect(activityService.create).toBeCalledTimes(1);
    expect(activityService.create).toBeCalledWith(
      project,
      project.createdBy.toString(),
      'project-created',
      {},
    );

    expect(spy_handleFilesAndTranscriptions).toBeCalledTimes(1);
  });

  it('create() should invite ', async () => {
    //Setup
    const user2 = await dbService.userModel.create({
      email: TEST_DATA.email2,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    const unknownEmail = 'test@test.de';
    const createProjectDto: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      emails: [user2.email, unknownEmail],
      sourceMode: 'video',
    };

    const spyMailService_sendInviteEmail = jest
      .spyOn(mailService, 'sendInviteEmail')
      .mockImplementation();

    //Test
    const response = await service.create(authUser, createProjectDto);
    const entity = instanceToPlain(response);

    const project = await dbService.projectModel
      .findOne({
        title: TEST_DATA.project.title,
      })
      .lean()
      .exec();

    expect(entity.users).toHaveLength(2);
    expect(entity.users).toEqual([
      {
        id: predefinedUser._id.toString(),
        email: predefinedUser.email,
        role: predefinedUser.role,
      },
      {
        id: user2._id.toString(),
        email: user2.email,
        role: user2.role,
      },
    ]);

    let user = await dbService.userModel.findById(predefinedUser._id);
    let projectIds: string[] = (user.projects as Types.ObjectId[]).map(
      (item: Types.ObjectId) => item.toString(),
    );
    expect(projectIds).toContain(project._id.toString());

    user = await dbService.userModel.findById(user2._id);
    projectIds = (user.projects as Types.ObjectId[]).map(
      (item: Types.ObjectId) => item.toString(),
    );
    expect(projectIds).toContain(project._id.toString());

    expect(spyMailService_sendInviteEmail).toBeCalledTimes(1);
  });

  it('findAll() should return users projects', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({ users: [authUser.id] });
    const proj2 = await dbService.projectModel.create({ users: [authUser.id] });
    await dbService.projectModel.create({}); //dont connect to user
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: [proj1.id, proj2.id] },
    });
    const query: FindAllProjectsQuery = {};

    //Test
    const { projects } = await service.findAll(authUser, query);
    expect(projects.map((o) => o._id)).toStrictEqual([
      proj2._id.toString(),
      proj1._id.toString(),
    ]);
  });

  it('findOne() should verify', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: TEST_DATA.validObjectId,
    });
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: proj1._id },
    });

    const spy_getProjectById = jest.spyOn(dbService, 'findProjectByIdOrThrow');
    const spy_projectPermissionGranted = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    const spy__getMediaLinksEntity = jest
      .spyOn(service, '_getMediaLinksEntity')
      .mockImplementation();

    //Test
    const response = await service.findOne(authUser, proj1._id.toString());
    expect(response._id).toEqual(proj1._id.toString());
    expect(spy_getProjectById).toBeCalledTimes(1);
    expect(spy_projectPermissionGranted).toBeCalledTimes(1);
    expect(spy__getMediaLinksEntity).toBeCalledTimes(1);
  });

  it('update() should verify', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
    });
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: proj1.id as string },
    });

    let project = await dbService.projectModel.findById(proj1.id as string);

    const spy_getProjectById = jest.spyOn(dbService, 'findProjectByIdOrThrow');
    const spy_projectPermissionGranted = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    const spy__getMediaLinksEntity = jest
      .spyOn(service, '_getMediaLinksEntity')
      .mockImplementation(() => Promise.resolve({ video: 'videourl' }));

    //Test
    const updateProjectDto: UpdateProjectDto = {
      title: TEST_DATA.project.title2,
    };
    await service.update(authUser, proj1.id, updateProjectDto);

    project = await dbService.projectModel.findById(proj1._id.toString());
    expect(project.title).toBe(TEST_DATA.project.title2);
    expect(spy_getProjectById).toBeCalledTimes(2);
    expect(spy_projectPermissionGranted).toBeCalledTimes(1);
    expect(spy__getMediaLinksEntity).toBeCalledTimes(1);
    expect(eventsGateway.projectUpdated).toBeCalledTimes(1);
    // expect(eventsGateway.projectUpdated).toBeCalledTimes(1);
  });

  it('remove() should verify', async () => {
    //Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
    });
    const projectId = initialProject._id;
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const spy_getProjectById = jest.spyOn(dbService, 'findProjectByIdOrThrow');
    const spy_isOwnProject = jest.spyOn(permissionsService, 'isProjectOwner');

    //Test
    await service.remove(authUser, projectId.toString());

    const user = await dbService.userModel.findById(authUser.id);
    const project = await dbService.projectModel.findById(projectId.toString());
    expect(user.projects.length).toBe(0);
    expect(project).toBeFalsy();
    expect(spy_getProjectById).toBeCalledTimes(1);
    expect(spy_isOwnProject).toBeCalledTimes(1);
    expect(eventsGateway.projectRemoved).toBeCalledTimes(1);
  });

  it('subscribe()', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const spy_getProjectById = jest.spyOn(dbService, 'findProjectByIdOrThrow');
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    await service.subscribe(authUser, projectId);

    expect(spy_getProjectById).toBeCalledTimes(1);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(eventsGateway.joinProjectRoom).toBeCalledTimes(1);
  });

  it('unsubscribe()', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const spy_getProjectById = jest.spyOn(dbService, 'findProjectByIdOrThrow');
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    await service.unsubscribe(authUser, projectId);

    expect(spy_getProjectById).toBeCalledTimes(1);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(eventsGateway.leaveProjectRoom).toBeCalledTimes(1);
  });

  it('invite()', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const spy_findProjectByIdOrThrowAndPopulate = jest.spyOn(
      dbService,
      'findProjectByIdOrThrowAndPopulate',
    );
    const spy_isProjectOwner = jest.spyOn(permissionsService, 'isProjectOwner');
    const spy_sendInviteEmail = jest.spyOn(mailService, 'sendInviteEmail');

    // Test
    const inviteDto: InviteDto = { emails: [EXAMPLE_USER.email] };

    await service.invite(authUser, projectId, inviteDto);

    expect(spy_findProjectByIdOrThrowAndPopulate).toBeCalledTimes(1);
    expect(spy_isProjectOwner).toBeCalledTimes(1);
    expect(spy_sendInviteEmail).toBeCalledTimes(1);
  });

  it('getInviteToken()', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
      inviteToken: EXAMPLE_PROJECT.inviteToken,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const findProjectByIdOrThrow = jest.spyOn(
      dbService,
      'findProjectByIdOrThrow',
    );
    const spy_isProjectOwner = jest.spyOn(permissionsService, 'isProjectOwner');

    // Test

    const response = await service.getInviteToken(authUser, projectId);

    expect(findProjectByIdOrThrow).toBeCalledTimes(1);
    expect(spy_isProjectOwner).toBeCalledTimes(1);
    expect(response.inviteToken).toEqual(EXAMPLE_PROJECT.inviteToken);
  });

  it('updateInviteToken()', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
      inviteToken: EXAMPLE_PROJECT.inviteToken,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const findProjectByIdOrThrow = jest.spyOn(
      dbService,
      'findProjectByIdOrThrow',
    );
    const spy_isProjectOwner = jest.spyOn(permissionsService, 'isProjectOwner');
    const spy_generateInviteToken = jest.spyOn(service, '_generateInviteToken');

    // Test
    const response = await service.updateInviteToken(authUser, projectId);

    expect(findProjectByIdOrThrow).toBeCalledTimes(1);
    expect(spy_isProjectOwner).toBeCalledTimes(1);
    expect(spy_generateInviteToken).toBeCalledTimes(1);
    expect(response.inviteToken).not.toEqual(EXAMPLE_PROJECT.inviteToken);

    const updatedProj = await dbService.projectModel.findById(projectId);
    expect(updatedProj.inviteToken).toEqual(response.inviteToken);
  });

  it('getWaveformData()', async () => {
    // TODO
    // Setup
    // Test
    expect(true).toBeTruthy();
  });

  it('getVideoChunk()', async () => {
    // TODO
    // Setup
    // Test
    expect(true).toBeTruthy();
  });
});
