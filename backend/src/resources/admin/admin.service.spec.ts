import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { RegistrationMode } from 'src/config/config.interface';
import { DbService } from 'src/modules/db/db.service';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { MailService } from '../../modules/mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AdminModule } from './admin.module';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let module: TestingModule;
  let MongooseModule: MongooseTestModule;
  let service: AdminService;
  let dbService: DbService;

  const userService = {};
  const mailService = {
    sendAdminCreateUserMail: jest.fn(),
    sendPasswordResetMail: jest.fn(),
    isActive: jest.fn(),
  };
  const authService = {
    createAdminAccessToken: jest.fn(),
    register: jest.fn(),
    resetPasswortByUserId: jest.fn(),
  };

  beforeEach(async () => {
    MongooseModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseModule, AdminModule],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(MailService)
      .useValue(mailService)
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    service = module.get<AdminService>(AdminService);
    dbService = module.get<DbService>(DbService);

    // Configure adminUser from config
    service.adminUser = {
      username: 'admin',
      password: 'secret123',
      hashedPassword: '', // using plaintext for this test
    };
  });

  afterEach(async () => {
    await MongooseModule.close(module);
    jest.clearAllMocks();
  });

  it('adminLogin() should login with valid credentials', async () => {
    // Setup
    const dto = {
      username: 'admin',
      password: 'secret123',
    };

    const spy = jest
      .spyOn(authService, 'createAdminAccessToken')
      .mockResolvedValue('admin-token');

    // Test
    const result = await service.adminLogin(dto);

    // Verify
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('admin-token');
  });

  it('adminLogin() should throw invalid_credentials for wrong username or password', async () => {
    // Setup
    const dto = {
      username: 'admin',
      password: 'wrong-password',
    };

    // Ensure adminUser is configured for plaintext login
    service.adminUser = {
      username: 'admin',
      password: 'secret123',
      hashedPassword: '',
    };

    // Test & Verify
    await expect(service.adminLogin(dto)).rejects.toThrow(
      'Invalid Credentials',
    );
  });

  it('adminLogin() should throw invalid_credentials when hashed password does not match', async () => {
    // Setup – create a valid bcrypt hash for "correct-password"
    const correctPassword = 'correct-password';
    const wrongPassword = 'wrong-password';

    const hashedPassword = await hash(correctPassword, 10);

    // Configure adminUser to use hashed login mode
    service.adminUser = {
      username: 'admin',
      password: undefined,
      hashedPassword,
    };

    const dto = {
      username: 'admin',
      password: wrongPassword,
    };

    // Test & Verify (match actual error message formatting)
    await expect(service.adminLogin(dto)).rejects.toThrow(
      'Invalid Credentials',
    );
  });

  it('createUser() should throw email_already_taken when user already exists', async () => {
    const dto = {
      email: 'existing@mail.com',
      name: 'Test User',
    };

    // Insert user into real in-memory DB
    await dbService.userModel.create({
      email: dto.email,
      hashedPassword: 'test',
    });

    await expect(service.createUser(dto)).rejects.toThrow(
      'Email Already Taken',
    );
  });

  it('resetPassword() should throw user_not_found when user does not exist', async () => {
    await expect(
      service.resetPassword(TEST_DATA.validObjectId),
    ).rejects.toThrow('User Not Found');
  });

  it('resetPassword() should send email when RegistrationMode.EMAIL is used', async () => {
    service.registrationConfig = {
      mode: RegistrationMode.EMAIL,
    };

    const user = await dbService.userModel.create({
      email: 'reset@mail.com',
      hashedPassword: 'test',
    });

    authService.resetPasswortByUserId.mockResolvedValue(undefined);

    const result = await service.resetPassword(user._id.toString());

    expect(result.method).toBe('email');

    // email sent
    expect(mailService.sendPasswordResetMail).toHaveBeenCalledTimes(1);
  });

  it('resetPassword() should return password when RegistrationMode.RETURN is used', async () => {
    service.registrationConfig = {
      mode: RegistrationMode.DISABLED,
    };

    const user = await dbService.userModel.create({
      email: 'reset2@mail.com',
      hashedPassword: 'test',
    });

    authService.resetPasswortByUserId.mockResolvedValue(undefined);

    const result = await service.resetPassword(user._id.toString());

    expect(result.method).toBe('return');
    expect(typeof result.password).toBe('string');
    expect(result.password.length).toBeGreaterThan(5);

    expect(mailService.sendPasswordResetMail).not.toHaveBeenCalled();
  });
});
