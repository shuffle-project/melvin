import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Readable } from 'stream';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { EXAMPLE_SPEAKER } from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { ProjectDocument } from '../../modules/db/schemas/project.schema';
import { UserDocument } from '../../modules/db/schemas/user.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { ExportSubtitlesService } from '../../modules/subtitle-format/export-subtitles.service';
import { AuthUser } from '../auth/auth.interfaces';
import { CaptionService } from '../caption/caption.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { SubtitleExportType } from './dto/download-subtitles.dto';
import { FindAllTranscriptionsQuery } from './dto/find-all-transcriptions.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { TranscriptionModule } from './transcription.module';
import { TranscriptionService } from './transcription.service';

describe('TranscriptionService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: TranscriptionService;
  let dbService: DbService;
  let permissions: PermissionsService;
  let captionService: CaptionService;
  let exportSubtitlesService: ExportSubtitlesService;

  let eventsGateway;

  let predefinedUser: UserDocument;
  let authUser: AuthUser;
  let setupProject: ProjectDocument;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    eventsGateway = {
      transcriptionCreated: jest.fn(),
      transcriptionUpdated: jest.fn(),
      transcriptionRemoved: jest.fn(),
      projectUpdated: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, TranscriptionModule],
    })
      .overrideProvider(EventsGateway)
      .useValue(eventsGateway)
      .compile();

    service = module.get<TranscriptionService>(TranscriptionService);
    dbService = module.get<DbService>(DbService);
    permissions = module.get<PermissionsService>(PermissionsService);
    captionService = module.get<CaptionService>(CaptionService);
    exportSubtitlesService = module.get<ExportSubtitlesService>(
      ExportSubtitlesService,
    );

    // Setup
    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });
    authUser = {
      id: predefinedUser._id.toString(),
      role: predefinedUser.role,
    };
    setupProject = await dbService.projectModel.create({
      users: [authUser.id],
      createdBy: authUser.id,
    });
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

    const createTranscriptionDto: CreateTranscriptionDto = {
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    };

    // Test
    const response = await service.create(authUser, createTranscriptionDto);
    expect(response._id).toBeDefined();

    const transcription = await dbService.transcriptionModel.findOne({
      title: TEST_DATA.exampleTranscriptionDto.title,
    });
    expect(transcription._id.toString()).toStrictEqual(response._id);
    expect(transcription.project).toStrictEqual(setupProject._id);

    const project = await dbService.projectModel.findById(setupProject._id);
    const transcriptionIds: string[] = (
      project.transcriptions as Types.ObjectId[]
    ).map((item: Types.ObjectId) => item.toString());
    expect(transcriptionIds).toContain(transcription.id);
    expect(eventsGateway.projectUpdated).toBeCalledTimes(1);
    expect(eventsGateway.transcriptionCreated).toBeCalledTimes(1);
  });

  it('findAll() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      project: setupProject._id,
    });
    const transc2 = await dbService.transcriptionModel.create({
      project: setupProject._id,
    });
    await dbService.transcriptionModel.create({});
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id, transc2._id] },
    });

    // Test
    const query: FindAllTranscriptionsQuery = {
      projectId: setupProject._id,
    };
    const response = await service.findAll(authUser, query);
    expect(response.map((o) => o._id)).toStrictEqual([
      transc1._id.toString(),
      transc2._id.toString(),
    ]);
  });

  it('findOne() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    });
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });

    const spy_isProjectMember = jest.spyOn(permissions, 'isProjectMember');

    // Test
    const response = await service.findOne(authUser, transc1._id);
    expect(response._id).toEqual(transc1._id.toString());
    expect(spy_isProjectMember).toBeCalledTimes(1);
  });

  it('update() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    });
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });

    const updateTranscriptionDto: UpdateTranscriptionDto = {
      title: TEST_DATA.project.title2,
    };

    const spy_isProjectMember = jest.spyOn(permissions, 'isProjectMember');

    // Test
    await service.update(authUser, transc1._id, updateTranscriptionDto);

    const transcription = await dbService.transcriptionModel.findById(
      transc1._id,
    );
    expect(transcription.title).toBe(TEST_DATA.project.title2);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(eventsGateway.transcriptionUpdated).toBeCalledTimes(1);
  });

  it('remove() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    });
    const transc1Id = transc1._id;
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });

    const spy_isOwnProject = jest.spyOn(permissions, 'isProjectOwner');
    // Test
    await service.remove(authUser, transc1Id);
    const project = await dbService.projectModel.findById(setupProject._id);
    const transcription = await dbService.transcriptionModel.findById(
      transc1Id as string,
    );
    expect(project.transcriptions.length).toBe(0);
    expect(transcription).toBeFalsy();
    expect(spy_isOwnProject).toBeCalledTimes(1);
    expect(eventsGateway.projectUpdated).toBeCalledTimes(1);
    expect(eventsGateway.transcriptionRemoved).toBeCalledTimes(1);
  });

  it('downdloadSubtitles() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    });
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });

    const spy_isProjectMember = jest.spyOn(permissions, 'isProjectMember');
    const spy_findAllCaptions = jest
      .spyOn(captionService, 'findAll')
      .mockImplementation(() =>
        Promise.resolve({ captions: [], total: 0, page: 0, count: 0 }),
      );
    const streamableFile = new StreamableFile(Readable.from(v4()));
    const spy_toVttFile = jest
      .spyOn(exportSubtitlesService, 'toVttFile')
      .mockImplementation(() => streamableFile);

    // Test
    const result = await service.downloadSubtitles(
      authUser,
      transc1._id.toString(),
      { type: SubtitleExportType.VTT },
    );

    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(spy_findAllCaptions).toBeCalledTimes(1);
    expect(spy_toVttFile).toBeCalledTimes(1);
    expect(result).toBe(streamableFile);
  });

  it('createSpeakers() should verify', async () => {
    // Setup
    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
    });
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });

    const spy_isProjectMember = jest.spyOn(permissions, 'isProjectMember');

    const newNames = [v4(), v4()];
    // Test
    const result = await service.createSpeakers(
      authUser,
      transc1._id.toString(),
      {
        names: newNames,
      },
    );

    expect(eventsGateway.transcriptionUpdated).toBeCalledTimes(1);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(result.speakers).toHaveLength(2);
    expect(result.speakers.some((obj) => newNames.includes(obj.name)));
  });

  it('updateSpeaker() should verify', async () => {
    // Setup
    const speakerIdToUpdate = new Types.ObjectId();

    const transc1 = await dbService.transcriptionModel.create({
      ...TEST_DATA.exampleTranscriptionDto,
      project: setupProject._id,
      speakers: [
        { _id: speakerIdToUpdate, name: EXAMPLE_SPEAKER.name + '_old' },
      ],
    });
    await dbService.projectModel.findByIdAndUpdate(setupProject._id, {
      $push: { transcriptions: [transc1._id] },
    });
    const spy_isProjectMember = jest.spyOn(permissions, 'isProjectMember');

    // Test
    const result = await service.updateSpeaker(
      authUser,
      transc1._id.toString(),
      speakerIdToUpdate.toString(),
      { name: EXAMPLE_SPEAKER.name },
    );

    expect(eventsGateway.transcriptionUpdated).toBeCalledTimes(1);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(result.speakers).toContainEqual({
      _id: speakerIdToUpdate.toString(),
      name: EXAMPLE_SPEAKER.name,
    });
  });
});
