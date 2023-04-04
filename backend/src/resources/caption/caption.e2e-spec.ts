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
import { createTestApplication } from '../../../test/test-application';
import { TEST_DATA } from '../../../test/test.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanUserDocument } from '../../modules/db/schemas/user.schema';
import { AuthUser } from '../auth/auth.interfaces';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../user/user.interfaces';
import { CaptionModule } from './caption.module';
import { CaptionService } from './caption.service';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { FindAllCaptionsQuery } from './dto/find-all-captions.dto';
import { UpdateCaptionDto } from './dto/update-caption.dto';

describe('CaptionController (e2e)', () => {
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
    getHistory: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        CaptionModule,
        AuthModule,
      ],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(CaptionService)
      .useValue(service)
      .compile();

    app = createTestApplication(module);
    await app.init();

    dbService = module.get<DbService>(DbService);

    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    const authService = module.get<AuthService>(AuthService);
    const token = authService.createAccessToken(predefinedUser);
    authHeader = { Authorization: `Bearer ${token}` };
    authUser = { id: predefinedUser._id.toString(), role: UserRole.USER };
  });

  afterAll(async () => {
    await MongooseTestModule.close(module);
    await app.close();
  });

  it('POST /captions should verify', async () => {
    // Setup
    const body: CreateCaptionDto = {
      transcription: new Types.ObjectId().toString() as any,
      text: 'Hello world',
      start: 0,
      end: 42,
      speakerId: new Types.ObjectId().toString(),
    };
    const result = { id: v4() };
    service.create.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/captions')
      .set(authHeader)
      .send(body);
    expect(service.create).toBeCalledWith(authUser, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST /captions unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer()).post('/captions');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /captions invalid body should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/captions')
      .set(authHeader)
      .send({
        // transcription: no-data,
        end: 'string',
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'transcription')).toBeTruthy();
    expect(details.some((o) => o.property === 'end')).toBeTruthy();
  });

  it('GET /captions should verify', async () => {
    // Setup
    const result = { id: v4() };
    const query: FindAllCaptionsQuery = {
      transcriptionId: new Types.ObjectId().toString(),
    };
    service.findAll.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get('/captions')
      .query(query)
      .set(authHeader)
      .send();
    expect(service.findAll).toBeCalledWith(authUser, query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /captions unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer()).get('/captions').send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /captions/:id should verify ', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.findOne.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/captions/${id}`)
      .set(authHeader)
      .send();
    expect(service.findOne).toBeCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /captions/:id unauthorized should fail', async () => {
    const response = await request(app.getHttpServer()).get('/captions').send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /captions/:id invalid id should fail ', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get(`/captions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /captions/:id should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const body: UpdateCaptionDto = { text: 'Hello world' };
    const result = { id: v4() };
    service.update.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/captions/${id}`)
      .set(authHeader)
      .send(body);
    expect(service.update).toBeCalledWith(authUser, id, body);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('PATCH /captions/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/captions/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /captions/:id invalid id should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/captions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send({
        text: 'Hello world',
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /captions/:id invalid body should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/captions/${TEST_DATA.validObjectId}`)
      .set(authHeader)
      .send({
        text: 234234,
        start: 'string',
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'text')).toBeTruthy();
    expect(details.some((o) => o.property === 'start')).toBeTruthy();
  });

  it('DELETE /captions/:id should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.remove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .delete(`/captions/${id}`)
      .set(authHeader)
      .send();
    expect(service.remove).toBeCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('DELETE /captions/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/captions/${new Types.ObjectId()}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /captions/:id invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/captions/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('GET /captions/:id/hisotry should verify ', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.getHistory.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/captions/${id}/history`)
      .set(authHeader)
      .send();
    expect(service.getHistory).toBeCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /captions/:id/hisotry unauthorized should fail', async () => {
    const id = new Types.ObjectId().toString();
    const response = await request(app.getHttpServer())
      .get('/captions/' + id + '/history')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /captions/:id/history invalid id should fail ', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get(`/captions/${TEST_DATA.invalidObjectId}/history`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });
});
