import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { v4 } from 'uuid';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { NoopWsAdapter } from '../../../test/noop-ws-adapter';
import { createTestApplication } from '../../../test/test-application';
import { TEST_DATA } from '../../../test/test.constants';
import { configuration } from '../../config/config.load';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
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
    app.useWebSocketAdapter(new NoopWsAdapter());
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
    expect(service.login).toHaveBeenCalledWith(body);
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
    expect(service.refreshToken).toHaveBeenCalledWith(body);
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
    expect(service.register).toHaveBeenCalledWith(body);
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

  it(`GET /auth/verfiy-invite/:inviteToken should verify`, async () => {
    // Setup
    const result = { projectTitle: v4(), userName: v4() };
    service.verifyInvite.mockImplementation(() => result);
    const inviteToken = v4();

    // Test
    const response = await request(app.getHttpServer()).get(
      '/auth/verify-invite/' + inviteToken,
    );
    expect(service.verifyInvite).toHaveBeenCalledWith(inviteToken);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });
});
