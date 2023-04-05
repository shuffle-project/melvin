import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { DbService } from '../../modules/db/db.service';
import { ProjectDocument } from '../../modules/db/schemas/project.schema';
import { TranscriptionDocument } from '../../modules/db/schemas/transcription.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from '../../utils/exceptions';
import { getObjectIdAsString } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { EventsGateway } from '../events/events.gateway';
import { UserRole } from '../user/user.interfaces';
import { CaptionModule } from './caption.module';
import { CaptionService } from './caption.service';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { FindAllCaptionsQuery } from './dto/find-all-captions.dto';
import { UpdateCaptionDto } from './dto/update-caption.dto';
import { CaptionListEntity } from './entities/caption-list.entity';
import { CaptionEntity } from './entities/caption.entity';

describe('CaptionService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: CaptionService;
  let dbService: DbService;
  let permissionsService: PermissionsService;

  const eventsGateway = {
    captionCreated: jest.fn(),
    captionUpdated: jest.fn(),
    captionRemoved: jest.fn(),
  };

  let authUser: AuthUser;
  let project: ProjectDocument;
  let transcription: TranscriptionDocument;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, CaptionModule],
    })
      .overrideProvider(EventsGateway)
      .useValue(eventsGateway)
      .compile();

    service = module.get<CaptionService>(CaptionService);
    dbService = module.get<DbService>(DbService);
    permissionsService = module.get<PermissionsService>(PermissionsService);

    authUser = { id: new Types.ObjectId().toString(), role: UserRole.USER };
    project = await dbService.projectModel.create({
      users: [authUser.id],
    });
    transcription = await dbService.transcriptionModel.create({
      project: project._id,
      speakers: [
        {
          _id: new Types.ObjectId(),
        },
      ],
    });
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(service).toBeDefined();
  });

  it('_isCaptionEditable() unlocked caption should be editable', async () => {
    //Setup
    const caption = await dbService.captionModel.create({
      lockedBy: null,
    });
    //Test
    const isEditable = service._isCaptionEditable(caption.toObject(), authUser);
    expect(isEditable).toBe(true);
  });

  it('_isCaptionEditable() locked caption should not be editable', async () => {
    //Setup
    const caption = await dbService.captionModel.create({
      lockedBy: new Types.ObjectId(),
    });
    //Test
    const isEditable = service._isCaptionEditable(caption.toObject(), authUser);
    expect(isEditable).toBe(false);
  });

  it('_isCaptionEditable() locked caption should be editable for same user', async () => {
    //Setup
    const caption = await dbService.captionModel.create({
      lockedBy: authUser.id,
    });
    //Test
    const isEditable = service._isCaptionEditable(caption.toObject(), authUser);
    expect(isEditable).toBe(true);
  });

  it('_isValidSpeakerId() should verify', async () => {
    //Setup

    //Test
    const isValid = service._isValidSpeakerId(
      transcription.toObject(),
      transcription.speakers[0]._id.toString(),
    );
    expect(isValid).toBe(true);
  });

  it('_isValidSpeakerId() should fail', async () => {
    //Setup

    //Test
    const isValid = service._isValidSpeakerId(
      transcription.toObject(),
      new Types.ObjectId().toString(),
    );
    expect(isValid).toBe(false);
  });

  it('create() should verify', async () => {
    // Setup
    const createCaptionDto: CreateCaptionDto = {
      transcription: transcription._id,
      text: 'Hello world',
      start: 42,
      end: 420,
      speakerId: transcription.speakers[0]._id.toString(),
    };

    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    const spy_isValidSpeakerId = jest.spyOn(service, '_isValidSpeakerId');

    // Test
    const entity = await service.create(authUser, createCaptionDto);
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(spy_isValidSpeakerId).toBeCalledTimes(1);
    expect(eventsGateway.captionCreated).toBeCalledTimes(1);
    expect(eventsGateway.captionCreated).toBeCalledWith(
      project.toObject(),
      entity,
    );

    expect(entity).toEqual(
      expect.objectContaining({
        ...createCaptionDto,
        transcription: createCaptionDto.transcription.toString(),
        speakerId: createCaptionDto.speakerId.toString(),
        initialText: createCaptionDto.text,
        project: project._id.toString(),
        wasManuallyEdited: false,
        updatedBy: authUser.id.toString(),
        lockedBy: null,
      }),
    );
  });

  it('create() with unknown transcriptionId should fail', async () => {
    // Setup
    const createCaptionDto: CreateCaptionDto = {
      transcription: new Types.ObjectId(),
      text: 'Hello world',
      start: 42,
      end: 420,
      speakerId: transcription.speakers[0]._id.toString(),
    };

    // Test
    let error: CustomBadRequestException;
    try {
      await service.create(authUser, createCaptionDto);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_transcription_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('create() with unknown speakerId should fail', async () => {
    // Setup
    const createCaptionDto: CreateCaptionDto = {
      transcription: transcription._id,
      text: 'Hello world',
      start: 42,
      end: 420,
      speakerId: new Types.ObjectId().toString(),
    };

    // Test
    let error: CustomBadRequestException;
    try {
      await service.create(authUser, createCaptionDto);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_speaker_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('create() without project permission should fail', async () => {
    // Setup
    const createCaptionDto: CreateCaptionDto = {
      transcription: transcription._id,
      text: 'Hello world',
      start: 42,
      end: 420,
      speakerId: transcription.speakers[0]._id.toString(),
    };

    // Test
    let error: CustomForbiddenException;
    try {
      await service.create(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        createCaptionDto,
      );
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('findAll() should verify', async () => {
    // Setup
    await Promise.all([
      dbService.captionModel.create({ transcription: new Types.ObjectId() }),
      dbService.captionModel.create({
        transcription: transcription._id,
        start: 1000,
      }),
      dbService.captionModel.create({ transcription: new Types.ObjectId() }),
    ]);

    const caption = await dbService.captionModel.create({
      transcription: transcription._id,
      start: 500,
    });

    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    const result = await service.findAll(authUser, {
      transcriptionId: transcription._id.toString(),
      limit: 1,
    });
    const doc = await dbService.captionModel
      .findById(caption._id)
      .lean()
      .exec();

    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(result).toEqual(
      plainToInstance(CaptionListEntity, {
        captions: [doc],
        total: 2,
        count: 1,
        page: 1,
      }),
    );
  });

  it('findAll() with unknown transcriptionId should fail', async () => {
    // Setup

    // Test
    let error: CustomBadRequestException;
    try {
      await service.findAll(authUser, {
        transcriptionId: new Types.ObjectId().toString(),
      });
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_transcription_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('findAll() without project permission should fail', async () => {
    // Setup
    const query: FindAllCaptionsQuery = {
      transcriptionId: transcription._id.toString(),
    };
    // Test
    let error: CustomForbiddenException;
    try {
      await service.findAll(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        query,
      );
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('findOne() should verify', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
    });
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    const result = await service.findOne(authUser, caption._id.toString());
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(result).toEqual(plainToInstance(CaptionEntity, caption.toObject()));
  });

  it('findOne() with unknown captionId should fail', async () => {
    // Setup

    // Test
    let error: CustomBadRequestException;
    try {
      await service.findOne(authUser, new Types.ObjectId().toString());
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_caption_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('findOne() without project permission should fail', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
    });
    // Test
    let error: CustomForbiddenException;
    try {
      await service.findOne(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        caption._id.toString(),
      );
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('update() should verify', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
      updatedBy: new Types.ObjectId(),
      text: 'Hello world',
      start: 42,
    });
    const updateCaptionDto: UpdateCaptionDto = {
      text: 'Hallo Welt',
      start: 1337,
    };
    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );
    const spy_isCaptionEditable = jest.spyOn(service, '_isCaptionEditable');

    // Test
    const entity = await service.update(
      authUser,
      caption._id.toString(),
      updateCaptionDto,
    );
    const updatedCaption = await dbService.captionModel
      .findById(caption._id)
      .lean()
      .exec();
    expect(spy_isProjectMember).toBeCalledTimes(1);
    expect(spy_isCaptionEditable).toBeCalledTimes(1);
    expect(eventsGateway.captionUpdated).toBeCalledTimes(1);
    expect(eventsGateway.captionUpdated).toBeCalledWith(
      project.toObject(),
      entity,
    );
    expect(entity).toEqual(plainToInstance(CaptionEntity, updatedCaption));
    expect(entity.text).toEqual(updateCaptionDto.text);
    expect(entity.start).toEqual(updateCaptionDto.start);
    expect(entity.history[0]).toEqual(
      expect.objectContaining({
        createdBy: caption.updatedBy.toString(),
        text: caption.text,
      }),
    );
  });

  it('update() with unknown captionId should fail', async () => {
    // Setup

    // Test
    let error: CustomBadRequestException;
    try {
      await service.update(authUser, new Types.ObjectId().toString(), {});
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_caption_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('update() without project permission should fail', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
    });
    const updateCaptionDto: UpdateCaptionDto = {
      text: 'Hallo Welt',
    };
    // Test
    let error: CustomForbiddenException;
    try {
      await service.update(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        caption._id.toString(),
        updateCaptionDto,
      );
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('update() with locked caption should fail', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
      lockedBy: new Types.ObjectId(),
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.update(authUser, caption._id.toString(), {});
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('caption_locked_by_other_user');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('remove() should verify', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
    });

    // Test
    await service.remove(authUser, caption._id.toString());
    expect(eventsGateway.captionRemoved).toBeCalledTimes(1);
    expect(eventsGateway.captionRemoved).toBeCalledWith(
      project.toObject(),
      caption.toObject(),
    );
  });

  it('remove() with unknown captionId should fail', async () => {
    // Setup
    await dbService.captionModel.create({});

    // Test
    let error: CustomBadRequestException;
    try {
      await service.remove(authUser, new Types.ObjectId().toString());
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_caption_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('remove() without project permission should fail', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
    });
    // Test
    let error: CustomForbiddenException;
    try {
      await service.remove(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        caption._id.toString(),
      );
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('remove() with locked caption should fail', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
      lockedBy: new Types.ObjectId(),
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.remove(authUser, caption._id.toString());
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('caption_locked_by_other_user');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('getHistory() should return history', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
      history: [{}, {}, {}],
    });

    const spy_isProjectMember = jest.spyOn(
      permissionsService,
      'isProjectMember',
    );

    // Test
    const result = await service.getHistory(authUser, caption._id.toString());
    expect(result).toHaveLength(3);

    expect(spy_isProjectMember).toBeCalledTimes(1);
  });

  it('getHistory() unknown_caption_id', async () => {
    // Setup
    // Test
    let error: CustomBadRequestException;
    try {
      await service.remove(authUser, TEST_DATA.validObjectId);
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_caption_id');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('getHistory() must_be_project_member', async () => {
    // Setup
    const caption = await dbService.captionModel.create({
      project: project._id,
      transcription: transcription._id,
      history: [{}, {}, {}],
    });

    // Test
    let error: CustomForbiddenException;
    try {
      await service.remove(
        { id: new Types.ObjectId().toString(), role: UserRole.USER },
        caption._id.toString(),
      );
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('must_be_project_member');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  //  the only test, method only for internal use
  it('createMany() should verify ', async () => {
    // Setup
    const dtos = [
      {
        transcription: transcription._id,
        text: 'Hello world',
        start: 42,
        end: 420,
        speakerId: transcription.speakers[0]._id.toString(),
      },
      {
        transcription: transcription._id,
        text: 'Hello world',
        start: 42,
        end: 420,
        speakerId: transcription.speakers[0]._id.toString(),
      },
    ];
    // Test
    const result = await service.createMany(
      authUser,
      dtos,
      getObjectIdAsString(project._id),
    );

    const count = await dbService.captionModel.countDocuments();

    expect(result).toHaveLength(dtos.length);
    expect(result).toHaveLength(count);
  });
});
