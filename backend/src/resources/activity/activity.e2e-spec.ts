import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from 'class-validator';
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
import { ActivityModule } from './activity.module';
import { ActivityService } from './activity.service';
import { FindAllActivitiesQuery } from './dto/find-all-activities.dto';

describe('ActivityController (e2e)', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let app: INestApplication;

  let dbService: DbService;
  let predefinedUser: LeanUserDocument;
  let authHeader: { Authorization: string };
  let authUser: AuthUser;

  const service = {
    findAll: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        ActivityModule,
        AuthModule,
      ],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(ActivityService)
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

  it('GET /activities should verify', async () => {
    // Setup
    const result = { id: v4() };
    const query: FindAllActivitiesQuery = {
      projectId: new Types.ObjectId().toString(),
    };
    service.findAll.mockImplementation(() => result);

    // Test
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query(query)
      .set(authHeader)
      .send();
    expect(service.findAll).toBeCalledWith(authUser, query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(result);
  });

  it('GET /activities unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get('/activities')
      .send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /activities invalid query should fail', async () => {
    // Test
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query({})
      .set(authHeader)
      .send({
        // transcription: no-data,
        end: 'string',
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.code).toBe('validation_error');

    const details = response.body.details as ValidationError[];
    expect(details.some((o) => o.property === 'projectId')).toBeDefined();
  });
});
