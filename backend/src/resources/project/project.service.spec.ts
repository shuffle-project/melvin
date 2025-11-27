import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { instanceToPlain } from 'class-transformer';
import { Types } from 'mongoose';
import { UserDocument } from 'src/modules/db/schemas/user.schema';
import { UploadService } from 'src/modules/upload/upload.service';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_USER,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import {
  MediaCategory,
  ProjectStatus,
} from '../../modules/db/schemas/project.schema';
import { MailService } from '../../modules/mail/mail.service';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { AsrVendors } from '../../processors/processor.interfaces';
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
  const uploadService = {
    getUploadMetadata: jest.fn(),
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
      .overrideProvider(UploadService)
      .useValue(uploadService)
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
      jwtId: 'some-jwt-id',
    };
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(service).toBeDefined();
  });

  xit('create() should verify', async () => {
    //Setup
    const createProjectDto: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      asrVendor: AsrVendors.WHISPER,
      videoOptions: [
        {
          uploadId: 'some-id',
          category: MediaCategory.MAIN,
          useAudio: true,
        },
      ],
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

    expect(activityService.create).toHaveBeenCalledTimes(1);
    expect(activityService.create).toHaveBeenCalledWith(
      project,
      project.createdBy.toString(),
      'project-created',
      {},
    );

    expect(spy_handleFilesAndTranscriptions).toHaveBeenCalledTimes(1);
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

    //Test
    const response = await service.findOne(authUser, proj1._id.toString());
    expect(response._id).toEqual(proj1._id.toString());
    expect(spy_getProjectById).toHaveBeenCalledTimes(1);
    expect(spy_projectPermissionGranted).toHaveBeenCalledTimes(1);
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

    //Test
    const updateProjectDto: UpdateProjectDto = {
      title: TEST_DATA.project.title2,
    };
    await service.update(authUser, proj1.id, updateProjectDto);

    project = await dbService.projectModel.findById(proj1._id.toString());
    expect(project.title).toBe(TEST_DATA.project.title2);
    expect(spy_getProjectById).toHaveBeenCalled();
    expect(spy_projectPermissionGranted).toHaveBeenCalledTimes(1);
    expect(eventsGateway.projectUpdated).toHaveBeenCalled();
    // expect(eventsGateway.projectUpdated).toHaveBeenCalledTimes(1);
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
    expect(spy_getProjectById).toHaveBeenCalledTimes(1);
    expect(spy_isOwnProject).toHaveBeenCalledTimes(1);
    expect(eventsGateway.projectRemoved).toHaveBeenCalledTimes(1);
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

    expect(spy_getProjectById).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
    expect(eventsGateway.joinProjectRoom).toHaveBeenCalledTimes(1);
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

    expect(spy_getProjectById).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
    expect(eventsGateway.leaveProjectRoom).toHaveBeenCalledTimes(1);
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

    const spy_findProjectByIdOrThrow = jest.spyOn(
      dbService,
      'findProjectByIdOrThrow',
    );
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    const spy_sendInviteEmail = jest.spyOn(mailService, 'sendInviteEmail');

    // Test
    const inviteDto: InviteDto = {
      emails: [EXAMPLE_USER.email, 'not-existing-mail@404.com'],
    };

    await service.invite(authUser, projectId, inviteDto);

    expect(spy_findProjectByIdOrThrow).toHaveBeenCalled();
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
    expect(spy_sendInviteEmail).toHaveBeenCalledTimes(1);
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
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test

    const response = await service.getInviteToken(authUser, projectId);

    expect(findProjectByIdOrThrow).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
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
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    const response = await service.updateInviteToken(authUser, projectId);

    expect(findProjectByIdOrThrow).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
    expect(response.inviteToken).not.toEqual(EXAMPLE_PROJECT.inviteToken);

    const updatedProj = await dbService.projectModel.findById(projectId);
    expect(updatedProj.inviteToken).toEqual(response.inviteToken);
  });

  it('_getMimetype() should return correct MIME type', () => {
    // Setup
    const validExtensions = [
      { extension: 'mp4', expectedMimetype: 'video/mp4' },
      { extension: 'mp3', expectedMimetype: 'audio/mp3' },
      { extension: 'wav', expectedMimetype: 'audio/wav' },
      { extension: 'json', expectedMimetype: 'application/json' },
    ];

    validExtensions.forEach(({ extension, expectedMimetype }) => {
      // Test
      const mimetype = service._getMimetype(extension);
      expect(mimetype).toBe(expectedMimetype);
    });

    // Test for unsupported extension
    const unsupportedExtension = 'txt';
    const unsupportedMimetype = service._getMimetype(unsupportedExtension);
    expect(unsupportedMimetype).toBe('text/plain');
  });

  it('getViewerToken() should return a valid viewer token', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
      viewerToken: EXAMPLE_PROJECT.viewerToken,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
    });

    const spy_findProjectByIdOrThrow = jest.spyOn(
      dbService,
      'findProjectByIdOrThrow',
    );
    const spy_isProjectOwner = jest.spyOn(permissionsService, 'isProjectOwner');

    // Test
    const response = await service.getViewerToken(authUser, projectId);

    expect(spy_findProjectByIdOrThrow).toHaveBeenCalledTimes(1);
    expect(spy_isProjectOwner).toHaveBeenCalledTimes(1);
    expect(response.viewerToken).toEqual(EXAMPLE_PROJECT.viewerToken);
  });

  it('updateViewerToken() should generate a new viewer token', async () => {
    // Setup
    const initialProject = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: authUser.id,
      viewerToken: EXAMPLE_PROJECT.viewerToken,
    });
    const projectId = initialProject._id.toString();
    await dbService.userModel.findByIdAndUpdate(authUser.id, {
      $push: { projects: projectId },
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
    const response = await service.updateViewerToken(authUser, projectId);

    expect(spy_findProjectByIdOrThrow).toHaveBeenCalledTimes(1);
    expect(spy_isProjectMember).toHaveBeenCalledTimes(1);
    expect(response.viewerToken).not.toEqual(EXAMPLE_PROJECT.viewerToken);

    const updatedProj = await dbService.projectModel.findById(projectId);
    expect(updatedProj.viewerToken).toEqual(response.viewerToken);
  });

  it('_buildUrl() should construct the correct URL', () => {
    // Setup
    const viewerToken = 'viewer-token';
    const mediaId = 'media-id';
    const mediaExtension = 'mp4';
    const addition = 'extra-path';

    // Test
    const url = service._buildUrl(
      viewerToken,
      mediaId,
      mediaExtension,
      addition,
    );

    expect(url).toBe(
      `${service['serverBaseUrl']}/media/${viewerToken}/${mediaId}_${addition}.${mediaExtension}`,
    );
  });

  it('_buildUrl() should construct URL without addition', () => {
    // Setup
    const viewerToken = 'viewer-token';
    const mediaId = 'media-id';
    const mediaExtension = 'mp4';

    // Test
    const url = service._buildUrl(viewerToken, mediaId, mediaExtension);

    expect(url).toBe(
      `${service['serverBaseUrl']}/media/${viewerToken}/${mediaId}.${mediaExtension}`,
    );
  });

  it('_setDefaultMainCategory() should set default category if not provided', () => {
    // Setup
    const createProjectDto: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      asrVendor: AsrVendors.WHISPER,
      videoOptions: [
        {
          uploadId: 'some-id',
          useAudio: true,
          category: MediaCategory.MAIN,
        },
      ],
    };

    // Test
    service['_setDefaultMainCategory'](createProjectDto);

    expect(createProjectDto.videoOptions[0].category).toBe(MediaCategory.MAIN);
  });

  it('_setDefaultMainCategory() should not overwrite existing category', () => {
    // Setup
    const createProjectDto: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      asrVendor: AsrVendors.WHISPER,
      videoOptions: [
        {
          uploadId: 'some-id',
          category: MediaCategory.OTHER,
          useAudio: true,
        },
      ],
    };

    // Test
    service['_setDefaultMainCategory'](createProjectDto);

    expect(createProjectDto.videoOptions[0].category).toBe(MediaCategory.MAIN);
  });
});
