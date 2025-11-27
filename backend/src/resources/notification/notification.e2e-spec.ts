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
import { FindAllNotificationsQuery } from './dto/find-all-notifications.dto';
import { NotificationModule } from './notification.module';
import { NotificationService } from './notification.service';

describe('NotificationController (e2e)', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let app: INestApplication;

  let dbService: DbService;
  let predefinedUser: LeanUserDocument;
  let authHeader: { Authorization: string };
  let authUser: AuthUser;

  const service = {
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    bulkRemove: jest.fn(),
    updateMany: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        NotificationModule,
        AuthModule,
      ],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(NotificationService)
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

  it('GET /notifications should verify', async () => {
    // Setup
    const result = { id: v4() };
    const query: FindAllNotificationsQuery = {
      userId: new Types.ObjectId().toString(),
    };
    service.findAll.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get('/notifications')
      .query(query)
      .set(authHeader)
      .send();
    expect(service.findAll).toHaveBeenCalledWith(authUser, query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /notifications unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get('/notifications')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /notifications invalid query should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get('/notifications')
      .query({})
      .set(authHeader)
      .send({
        // transcription: no-data,
        end: 'string',
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'userId')).toBeDefined();
  });

  it('PATCH /notifications/:id should verify', async () => {
    // Setup
    const id = new Types.ObjectId().toString();
    const body = { read: true };
    const result = { id: v4() };
    service.update.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/notifications/${id}`)
      .set(authHeader)
      .send(body);
    expect(service.update).toHaveBeenCalledWith(authUser, id, body);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('PATCH /notifications/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/notifications/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /notifications/:id invalid id should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/notifications/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send({
        read: true,
      });

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /notifications/:id invalid body should fail', async () => {
    // Test
    const responseInvalidId = await request(app.getHttpServer())
      .patch(`/notifications/${TEST_DATA.validObjectId}`)
      .set(authHeader)
      .send({});

    expect(responseInvalidId.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseInvalidId.body.code).toBe('validation_error');

    const details = responseInvalidId.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'read')).toBeDefined();
  });

  it('DELETE /notifications/:id should verify', async () => {
    // Setup
    const id = TEST_DATA.validObjectId;
    const result = { id: v4() };
    service.remove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .delete(`/notifications/${id}`)
      .set(authHeader)
      .send();
    expect(service.remove).toHaveBeenCalledWith(authUser, id);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('DELETE /notifications/:id unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/notifications/${TEST_DATA.validObjectId}`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /notifications/:id invalid id should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .delete(`/notifications/${TEST_DATA.invalidObjectId}`)
      .set(authHeader)
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'id')).toBeTruthy();
  });

  it('PATCH /notifications should verify', async () => {
    // Setup
    const body = { notifications: [] };
    const result = { id: v4() };
    service.updateMany.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/notifications`)
      .set(authHeader)
      .send(body);
    expect(service.updateMany).toHaveBeenCalledWith(authUser, body);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual(result);
  });

  it('PATCH /notifications invalid body', async () => {
    // Setup
    const body = { notifications: 123 };
    const result = { id: v4() };
    service.updateMany.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .patch(`/notifications`)
      .set(authHeader)
      .send(body);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'notifications')).toBeDefined();
  });

  it('PATCH /notifications  unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .patch(`/notifications`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /notifications/bulk-remove should verify', async () => {
    // Setup
    const body = { notificationIds: [TEST_DATA.validObjectId] };
    const result = { id: v4() };
    service.bulkRemove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post(`/notifications/bulk-remove`)
      .set(authHeader)
      .send(body);
    expect(service.bulkRemove).toHaveBeenCalledWith(authUser, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it('POST /notifications/bulk-remove invalid body', async () => {
    // Setup
    const body = {};
    const result = { id: v4() };
    service.bulkRemove.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post(`/notifications/bulk-remove`)
      .set(authHeader)
      .send(body);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'notificationsId')).toBeDefined();
  });

  it('POST /notifications/bulk-remove  unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post(`/notifications/bulk-remove`)
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
