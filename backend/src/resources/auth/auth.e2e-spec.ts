import {
  ExecutionContext,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import request from 'supertest';
import { v4 } from 'uuid';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { createTestApplication } from '../../../test/test-application';
import { TEST_DATA } from '../../../test/test.constants';
import { configuration } from '../../config/config.load';
import { UserRole } from '../user/user.interfaces';
import { AuthUser } from './auth.interfaces';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthMediaAccessTokenDto } from './dto/auth-media-access-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController (e2e)', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let app: INestApplication;

  const service = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    createMediaAccessToken: jest.fn(),
    register: jest.fn(),
    verifyEmail: jest.fn(),
    guestLogin: jest.fn(),
    verifyInvite: jest.fn(),
  };
  const guard = {
    canActivate: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        MongooseTestModule,
        AuthModule,
      ],
    })
      .overrideProvider(AuthService)
      .useValue(service)
      .overrideGuard(JwtAuthGuard)
      .useValue(guard)
      .compile();

    app = createTestApplication(module);
    await app.init();
  });

  afterAll(async () => {
    await MongooseTestModule.close(module);
    await app.close();
  });

  it(`POST /auth/login should verify`, async () => {
    // Setup
    const body = {
      email: TEST_DATA.email,
      password: TEST_DATA.password,
    };
    const result = { id: v4() };
    service.login.mockImplementation((dto: AuthLoginDto) => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body);
    expect(service.login).toBeCalledWith(body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toStrictEqual(result);
  });

  it(`POST /auth/login invalid body should fail`, async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'wrong',
      });
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`POST /auth/refresh-token should verify`, async () => {
    // Setup
    const body = { token: TEST_DATA.token };
    const result = { id: v4() };
    service.refreshToken.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send(body);
    expect(service.refreshToken).toBeCalledWith(body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(result);
  });

  it(`POST /auth/refresh-token invalid body should fail`, async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`POST /auth/media-access-token should verify`, async () => {
    // Setup
    const body: AuthMediaAccessTokenDto = {
      projectId: TEST_DATA.validObjectId,
    };
    const result = { id: v4() };
    const authHeader = { Authorization: `Bearer ${TEST_DATA.token}` };
    const authUser: AuthUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.USER,
    };

    service.createMediaAccessToken.mockImplementationOnce(() => result);
    guard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = JSON.parse(JSON.stringify(authUser));
      return true;
    });

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/media-access-token')
      .set(authHeader)
      .send(body);
    expect(service.createMediaAccessToken).toBeCalledWith(authUser, body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(result);
  });

  it('POST /auth/media-access-token unauthorized should fail', async () => {
    // Setup
    guard.canActivate.mockRejectedValueOnce(new UnauthorizedException());

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/media-access-token')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it(`POST /auth/media-access-token invalid body should fail`, async () => {
    // Setup
    const body = {};
    const authHeader = { Authorization: `Bearer ${TEST_DATA.token}` };
    const authUser: AuthUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.USER,
    };

    guard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = JSON.parse(JSON.stringify(authUser));
      return true;
    });

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/media-access-token')
      .set(authHeader)
      .send(body);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`POST /auth/register should verify`, async () => {
    // Setup
    const body = {
      email: TEST_DATA.email,
      password: TEST_DATA.password,
      name: TEST_DATA.name,
    };
    const result = { id: v4() };
    service.register.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(body);
    expect(service.register).toBeCalledWith(body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(result);
  });

  it(`POST /auth/register invalid body should fail`, async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`POST /auth/verify-email should verify`, async () => {
    // Setup
    const body = { verificationToken: 'abc' };
    const result = { id: v4() };
    service.verifyEmail.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send(body);
    expect(service.verifyEmail).toBeCalledWith(body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(result);
  });

  it(`POST /auth/verify-email invalid body should fail`, async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`POST /auth/guest-login should verify`, async () => {
    // Setup
    const body = { inviteToken: 'abc', name: 'Anonymous Cat' };
    const result = { id: v4() };
    service.guestLogin.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/guest-login')
      .send(body);
    expect(service.guestLogin).toBeCalledWith(body);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(result);
  });

  it(`POST /auth/guest-login invalid body should fail`, async () => {
    // Test
    const response = await request(app.getHttpServer())
      .post('/auth/guest-login')
      .send();
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');
  });

  it(`GET /auth/verfiy-invite/:inviteToken should verify`, async () => {
    // Setup
    const result = { projectTitle: v4(), userName: v4() };
    service.verifyInvite.mockImplementation(() => result);
    const inviteToken = v4();

    // Test
    const response = await request(app.getHttpServer()).get(
      '/auth/verify-invite/' + inviteToken,
    );
    expect(service.verifyInvite).toBeCalledWith(inviteToken);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });
});
