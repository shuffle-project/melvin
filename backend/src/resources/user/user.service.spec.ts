import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { EmailConfig } from '../../config/config.interface';
import { DbService } from '../../modules/db/db.service';
import { UserDocument } from '../../modules/db/schemas/user.schema';
import { CustomInternalServerException } from '../../utils/exceptions';
import { FindAllUsersQuery } from './dto/find-all-users.dto';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './user.interfaces';
import { UserModule } from './user.module';
import { UserService } from './user.service';

describe('UserService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: UserService;
  let dbService: DbService;
  let configService: ConfigService;

  let users: UserDocument[];

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();
    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, UserModule],
    }).compile();

    service = module.get<UserService>(UserService);
    dbService = module.get<DbService>(DbService);
    configService = module.get<ConfigService>(ConfigService);

    users = await Promise.all([
      dbService.userModel.create({ name: 'John', email: 'john@web.com' }),
      dbService.userModel.create({ name: 'Max', email: 'max@web.de' }),
      dbService.userModel.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      }),
    ]);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onApplicationBootstrap() should skip system user modification', async () => {
    // Setup
    const user = await dbService.userModel.create({
      role: UserRole.SYSTEM,
      name: 'System',
      email: configService.get<EmailConfig>('email').mailFrom,
      hashedPassword: null,
    });

    // Test
    await service.onApplicationBootstrap();

    const users = await dbService.userModel
      .find({ role: UserRole.SYSTEM })
      .lean()
      .exec();

    expect(users.length).toBe(1);
    expect(users[0]).toMatchObject(user.toObject());
  });

  it('onApplicationBootstrap() should create system user', async () => {
    // Test
    await service.onApplicationBootstrap();

    const users = await dbService.userModel
      .find({ role: UserRole.SYSTEM })
      .lean()
      .exec();

    expect(users.length).toBe(1);
    expect(users[0]).toMatchObject({
      role: UserRole.SYSTEM,
      name: 'System',
      email: configService.get<EmailConfig>('email').mailFrom,
      hashedPassword: null,
    });
  });

  it('onApplicationBootstrap() should update system user', async () => {
    // Setup
    const user = await dbService.userModel.create({
      role: UserRole.SYSTEM,
      name: 'System',
      email: 'old-system-user@example.com',
      hashedPassword: null,
    });

    // Test
    await service.onApplicationBootstrap();

    const users = await dbService.userModel.find({ role: UserRole.SYSTEM });

    expect(users.length).toBe(1);
    expect(users[0]).toMatchObject({
      _id: user._id,
      email: configService.get<EmailConfig>('email').mailFrom,
    });
  });

  it('findSystemUser() should verify', async () => {
    // Setup
    const user = await dbService.userModel.create({ role: UserRole.SYSTEM });

    // Test
    const result = await service.findSystemUser();
    expect(result).toEqual(user.toObject());
  });

  it('findSystemUser() should fail', async () => {
    // Test
    let error: CustomInternalServerException;
    try {
      await service.findSystemUser();
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('system_user_not_found');
    expect(error).toBeInstanceOf(CustomInternalServerException);
  });

  it('findAll() should verify', async () => {
    // Setup
    const query: FindAllUsersQuery = { search: 'jane' };

    // Test
    const result = await service.findAll(query);
    expect(result.length).toBe(1);
    expect(result).toEqual(
      [users[2]].map((o) => plainToInstance(UserEntity, o.toObject())),
    );
  });

  it('findAll() with email only string should verify', async () => {
    // Setup
    const query: FindAllUsersQuery = { search: 'web' };

    // Test
    const result = await service.findAll(query);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      [users[0], users[1]].map((o) =>
        plainToInstance(UserEntity, o.toObject()),
      ),
    );
  });

  it('findAll() with alphabetically order should verify', async () => {
    // Setup
    const query: FindAllUsersQuery = { search: 'j' };

    // Test
    const result = await service.findAll(query);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      [users[2], users[0]].map((o) =>
        plainToInstance(UserEntity, o.toObject()),
      ),
    );
  });
});
