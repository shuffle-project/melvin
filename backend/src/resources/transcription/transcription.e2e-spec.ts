import { HttpStatus, INestApplication, ValidationError } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import request from 'supertest';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { NoopWsAdapter } from '../../../test/noop-ws-adapter';
import { createTestApplication } from '../../../test/test-application';
import { TEST_DATA } from '../../../test/test.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanUserDocument } from '../../modules/db/schemas/user.schema';
import { AuthUser, DecodedToken } from '../auth/auth.interfaces';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../user/user.interfaces';
import { CreateSpeakersDto } from './dto/create-speakers.dto';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { SubtitleExportType } from './dto/download-subtitles.dto';
import { FindAllTranscriptionsQuery } from './dto/find-all-transcriptions.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { TranscriptionModule } from './transcription.module';
import { TranscriptionService } from './transcription.service';

describe('TranscriptionController (e2e)', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let app: INestApplication;

  let dbService: DbService;
  let predefinedUser: LeanUserDocument;
  let authHeader: { Authorization: string };
  let authUser: AuthUser;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createSpeakers: jest.fn(),
    updateSpeaker: jest.fn(),
    downloadSubtitles: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        TranscriptionModule,
        AuthModule,
      ],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(TranscriptionService)
      .useValue(service)
      .compile();

    app = createTestApplication(module);
    app.useWebSocketAdapter(new NoopWsAdapter()); // ← turns off WebSockets for tests
    await app.init();

    dbService = module.get<DbService>(DbService);

    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    const authService = module.get<AuthService>(AuthService);
    const token = await authService.createUserAccessToken(predefinedUser);
    const decodedToken: DecodedToken = await authService.decodeToken(token);

    authHeader = { Authorization: `Bearer ${token}` };
    authUser = {
      id: predefinedUser._id.toString(),
      role: UserRole.USER,
      jwtId: decodedToken.jti,
    };
  });

  afterAll(async () => {
    await MongooseTestModule.close(module);
    await app.close();
  });

  it('should verify', () => {
    expect(service).toBeTruthy();
  });

  it('POST /transcriptions should verify', async () => {
    // Setup
    const body: CreateTranscriptionDto = {
      project: new Types.ObjectId().toString() as any,
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
    };
    const result = { id: v4() };
    service.create.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/transcriptions')
      .set(authHeader)
      .send(body);

    expect(service.create).toHaveBeenCalledWith(authUser, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST /transcriptions unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/transcriptions')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /transcriptions should verify', async () => {
    // Setup
    const result = { id: v4() };
    const query: FindAllTranscriptionsQuery = {
      projectId: TEST_DATA.validObjectId,
    };
    service.findAll.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/transcriptions`)
      .query(query)
      .set(authHeader)
      .send();
    expect(service.findAll).toHaveBeenCalledWith(authUser, query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /transcriptions unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get('/transcriptions')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /transcriptions/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const result = { id: v4() };
    service.findOne.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/transcriptions/${id}`)
      .set(authHeader)
      .send();
    expect(service.findOne).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /transcriptions/:id unauthorized should fail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/transcriptions/${TEST_DATA.invalidObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /transcriptions/:id invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get(`/transcriptions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /transcriptions/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const body: UpdateTranscriptionDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
    };
    const result = { id: v4() };
    service.update.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/transcriptions/${id}`)
      .set(authHeader)
      .send(body);
    expect(service.update).toHaveBeenCalledWith(authUser, id, body);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('PATCH /transcriptions/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/transcriptions/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /transcriptions/:id invalid id should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/transcriptions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send({
        title: TEST_DATA.project.title,
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /transcriptions/:id invalid body should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/transcriptions/${TEST_DATA.validObjectId}`)
      .set(authHeader)
      .send({
        title: 234234,
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'title')).toBeTruthy();
  });

  it('DELETE /transcriptions/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const result = { id: v4() };
    service.remove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .delete(`/transcriptions/${id}`)
      .set(authHeader)
      .send();
    expect(service.remove).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('DELETE /transcriptions/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/transcriptions/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /transcriptions/:id invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/transcriptions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('POST /transcriptions/:id/speakers should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const body: CreateSpeakersDto = { names: [TEST_DATA.name] };
    const result = { id: v4() };
    service.createSpeakers.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/transcriptions/' + id + '/speakers')
      .set(authHeader)
      .send(body);

    expect(service.createSpeakers).toHaveBeenCalledWith(authUser, id, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST /transcriptions/:id/speakers unauthorized should fail', async () => {
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .post(`/transcriptions/${id}/speakers`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /transcriptions/:id/speakers invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/transcriptions/${TEST_DATA.invalidObjectId}/speakers`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('POST /transcriptions/:id/speakers invalid body should fail', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const body = { names: 123 }; // invalid body
    // Test
    const response = await request(app.getHttpServer())
      .post(`/transcriptions/${id}/speakers`)
      .set(authHeader)
      .send(body);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'names')).toBeTruthy();
  });

  it('PATCH /transcriptions/:id/speakers/:speakerId should veify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const speakerId = new Types.ObjectId().toString();
    const body: UpdateSpeakerDto = { name: TEST_DATA.name };
    const result = { id: v4() };
    service.updateSpeaker.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/transcriptions/${id}/speakers/${speakerId}`)
      .set(authHeader)
      .send(body);
    expect(service.updateSpeaker).toHaveBeenCalledWith(
      authUser,
      id,
      speakerId,
      body,
    );
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('PATCH /transcriptions/:id/speakers/:speakerId unauthorized should fail', async () => {
    const id = new Types.ObjectId().toString();
    const speakerId = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/transcriptions/${id}/speakers/${speakerId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /transcriptions/:id/speakers/:speakerId invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(
        `/transcriptions/${TEST_DATA.invalidObjectId}/speakers/${TEST_DATA.validObjectId}`,
      )
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /transcriptions/:id/speakers/:speakerId invalid speakerId should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(
        `/transcriptions/${TEST_DATA.validObjectId}/speakers/${TEST_DATA.invalidObjectId}`,
      )
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'idSpeaker')).toBeTruthy();
  });

  it('PATCH /transcriptions/:id/speakers/:speakerId invalid body should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const speakerId = new Types.ObjectId().toString();
    const body = {}; // invalid body
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/transcriptions/${id}/speakers/${speakerId}`)
      .set(authHeader)
      .send(body);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'name')).toBeTruthy();
  });

  it('GET /transcriptions/:id/downloadSubtitles', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const type = SubtitleExportType.SRT;
    const result = { id: v4() };
    service.downloadSubtitles.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/transcriptions/${id}/downloadSubtitles?type=${type}`)
      .set(authHeader)
      .send();
    expect(service.downloadSubtitles).toHaveBeenCalledWith(authUser, id, {
      type,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /transcriptions/:id/downloadSubtitles unauthorized should fail', async () => {
    const id = new Types.ObjectId().toString();
    const type = SubtitleExportType.SRT;
    // Test
    const response = await request(app.getHttpServer())
      .get(`/transcriptions/${id}/downloadSubtitles?type=${type}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /transcriptions/:id/downloadSubtitles invalid id should fail', async () => {
    const type = SubtitleExportType.SRT;
    // Test
    const response = await request(app.getHttpServer())
      .get(
        `/transcriptions/${TEST_DATA.invalidObjectId}/downloadSubtitles?type=${type}`,
      )
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('GET /transcriptions/:id/downloadSubtitles invalid queryparam', async () => {
    const type = 'invalid'; //: 'srt' | 'vtt' = 'srt';
    // Test
    const response = await request(app.getHttpServer())
      .get(
        `/transcriptions/${TEST_DATA.validObjectId}/downloadSubtitles?type=${type}`,
      )
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'type')).toBeTruthy();
  });
});
