import { HttpStatus, INestApplication, ValidationError } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AsrVendors } from 'src/processors/processor.interfaces';
import request from 'supertest';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
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
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { ProjectModule } from './project.module';
import { ProjectService } from './project.service';

describe('ProjectController (e2e)', () => {
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
    getInviteToken: jest.fn(),
    getVideoChunk: jest.fn(),
    getWaveformData: jest.fn(),
    invite: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    updateInviteToken: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        ProjectModule,
        AuthModule,
      ],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(ProjectService)
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

  it('POST /projects should verify', async () => {
    // Setup
    const body: CreateProjectDto = {
      title: TEST_DATA.project.title,
      language: TEST_DATA.languageCodeDE,
      asrVendor: AsrVendors.WHISPER,
      videoOptions: [],

      // emails: [TEST_DATA.email, TEST_DATA.email2],
      // sourceMode: 'video',
    };
    const result = { id: v4() };
    service.create.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader)
      .send(body);
    expect(service.create).toHaveBeenCalledWith(authUser, {
      ...body,
      recorder: false,
    });
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST /projects unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/projects')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /projects should verify', async () => {
    // Setup
    const result = { id: v4() };
    const query: FindAllProjectsQuery = {};
    service.findAll.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get('/projects')
      .query(query)
      .set(authHeader)
      .send();
    expect(service.findAll).toHaveBeenCalledWith(authUser, query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /projects unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer()).get('/projects').send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /projects/:id should verify ', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const result = { id: v4() };
    service.findOne.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .set(authHeader)
      .send();
    expect(service.findOne).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /projects/:id unauthorized should fail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${TEST_DATA.invalidObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /projects/:id invalid id should fail ', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get(`/projects/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /projects/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const body = {
      title: TEST_DATA.project.title,
    };
    const result = { id: v4() };
    service.update.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/projects/${id}`)
      .set(authHeader)
      .send(body);

    expect(response.body).toStrictEqual(result);
    expect(service.update).toHaveBeenCalledWith(authUser, id, {
      ...body,
      recorder: false,
    });
    expect(response.status).toBe(HttpStatus.OK);
  });

  it('PATCH /projects/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/projects/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /projects/:id invalid id should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/projects/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send({
        title: TEST_DATA.project.title,
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /projects/:id invalid body should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/projects/${TEST_DATA.validObjectId}`)
      .set(authHeader)
      .send({
        title: 234234,
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'title')).toBeTruthy();
  });

  it('DELETE /projects/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const result = { id: v4() };
    service.remove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .delete(`/projects/${id}`)
      .set(authHeader)
      .send();
    expect(service.remove).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('DELETE /projects/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/projects/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /projects/:id invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/projects/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('GET projects/:id/invite-token should verify', async () => {
    // Setup
    const result = { id: v4() };
    const id = TEST_DATA.validObjectId;
    service.getInviteToken.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get('/projects/' + id + '/invite-token')
      .set(authHeader)
      .send();
    expect(service.getInviteToken).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET projects/:id/invite-token unauthorized should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .get('/projects/' + id + '/invite-token')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET projects/:id/invite-token invalid id', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get(`/projects/${TEST_DATA.invalidObjectId}/invite-token`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  // TODO
  // it('GET projects/:id/media/video should verify', async () => {
  //   // Setup
  //   const result = { id: v4() };
  //   const id = TEST_DATA.validObjectId;
  //   service.getVideoChunk.mockImplementation(() => result);
  //   const mediaAccessUser = { projectId: id };

  //   // Test
  //   const response = await request(app.getHttpServer())
  //     .get('/projects/' + id + '/media/video')
  //     .set(authHeader)
  //     .send();
  //   expect(service.getVideoChunk).toHaveBeenCalledWith(id, mediaAccessUser);
  //   expect(response.status).toBe(HttpStatus.PARTIAL_CONTENT);
  //   expect(response.body).toEqual(result);
  // });

  it('POST projects/:id/invite should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const body: InviteDto = { emails: [] };
    const result = { id: v4() };
    service.invite.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/invite')
      .set(authHeader)
      .send(body);
    expect(service.invite).toHaveBeenCalledWith(authUser, id, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST projects/:id/invite unauthorized should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/invite')
      .send({});
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST projects/:id/invite invalid id', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/projects/${TEST_DATA.invalidObjectId}/invite`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('POST projects/:id/invite invalid body', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/projects/${TEST_DATA.validObjectId}/invite`)
      .set(authHeader)
      .send({ emails: ['lala'] });
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'emails')).toBeTruthy();
  });

  it('POST projects/:id/subscribe should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.subscribe.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/subscribe')
      .set(authHeader)
      .send({});
    expect(service.subscribe).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST projects/:id/subscribe unauthorized should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/subscribe')
      .send({});
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST projects/:id/subscribe invalid id', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/projects/${TEST_DATA.invalidObjectId}/subscribe`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('POST projects/:id/unsubscribe should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.unsubscribe.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/unsubscribe')
      .set(authHeader)
      .send({});
    expect(service.unsubscribe).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST projects/:id/unsubscribe unauthorized should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/unsubscribe')
      .send({});
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST projects/:id/unsubscribe invalid id', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/projects/${TEST_DATA.invalidObjectId}/unsubscribe`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('POST projects/:id/invite-token should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const result = { id: v4() };
    service.updateInviteToken.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/invite-token')
      .set(authHeader)
      .send({});
    expect(service.updateInviteToken).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST projects/:id/invite-token unauthorized should fail', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    // Test
    const response = await request(app.getHttpServer())
      .post('/projects/' + id + '/invite-token')
      .send({});
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST projects/:id/invite-token invalid id', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/projects/${TEST_DATA.invalidObjectId}/invite-token`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });
});
