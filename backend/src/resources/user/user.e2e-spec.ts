import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeanUserDocument } from 'src/modules/db/schemas/user.schema';
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
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindAllUsersQuery } from './dto/find-all-users.dto';
import { UserRole } from './user.interfaces';
import { UserModule } from './user.module';
import { UserService } from './user.service';

describe('UserController (e2e)', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let app: INestApplication;

  let dbService: DbService;
  let predefinedUser: LeanUserDocument;
  let authHeader: { Authorization: string };

  const service = {
    findAll: jest.fn(),
  };

  beforeAll(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, UserModule, AuthModule],
      providers: [JwtAuthGuard],
    })
      .overrideProvider(UserService)
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
    const token = authService.createUserAccessToken(predefinedUser);
    authHeader = { Authorization: `Bearer ${token}` };
  });

  afterAll(async () => {
    await MongooseTestModule.close(module);
    await app.close();
  });

  it('should verify', () => {
    expect(service).toBeTruthy();
  });

  it('GET /users should verify', async () => {
    // Setup
    const expectedResult = {
      id: v4(),
      role: UserRole.USER,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
    };
    service.findAll.mockImplementation(() => expectedResult);
    const query: FindAllUsersQuery = { search: 'jane' };

    // Test
    const response = await request(app.getHttpServer())
      .get(`/users`)
      .query(query)
      .set(authHeader)
      .send();

    expect(service.findAll).toBeCalledWith(query);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual(expectedResult);
  });
  it('GET /users unauthorized should fail', async () => {
    // Test
    const response = await request(app.getHttpServer()).get('/users').send();
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
