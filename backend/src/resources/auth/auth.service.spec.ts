import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_USER,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from '../../utils/exceptions';
import { getObjectIdAsString } from '../../utils/objectid';
import { UserRole } from '../user/user.interfaces';
import { DecodedToken } from './auth.interfaces';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthGuestLoginDto } from './dto/auth-guest-login.dto';

describe('AuthService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;

  let service: AuthService;
  let dbService: DbService;
  let jwtService: JwtService;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, AuthModule],
      providers: [],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dbService = module.get<DbService>(DbService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(service).toBeDefined();
  });

  it('login() valid password should verify', async () => {
    // Setup
    const user = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    // Test
    const { token } = await service.login({
      email: TEST_DATA.email,
      password: TEST_DATA.password,
    });
    const decoded = jwtService.decode(token) as DecodedToken;
    expect(decoded.id).toBe(user.id);
  });

  it('login() unknown email should fail', async () => {
    // Setup
    await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.login({
        email: TEST_DATA.invalidEmail,
        password: TEST_DATA.password,
      });
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('unknown_email');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('login() invalid password should fail', async () => {
    // Setup
    await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.login({
        email: TEST_DATA.email,
        password: TEST_DATA.invalidPassword,
      });
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('invalid_password');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('login() system user should fail', async () => {
    // Setup
    await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
      role: UserRole.SYSTEM,
    });

    // Test
    let error: CustomForbiddenException;
    try {
      await service.login({
        email: TEST_DATA.email,
        password: TEST_DATA.hashedPassword,
      });
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('system_user_login_is_blocked');
    expect(error).toBeInstanceOf(CustomForbiddenException);
  });

  it('refreshToken() valid token should verify', async () => {
    // Setup
    const user = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });
    const oldToken = service.createAccessToken(user.toJSON() as any);

    // Test
    const { token: newToken } = await service.refreshToken({ token: oldToken });
    const oldDecodedToken = jwtService.decode(oldToken) as DecodedToken;
    const newDecodedToken = jwtService.decode(newToken) as DecodedToken;
    expect(oldDecodedToken.id).toEqual(newDecodedToken.id);
    expect(oldDecodedToken).not.toEqual(newDecodedToken);
  });

  it('refreshToken() invalid token should fail', async () => {
    // Setup
    const user = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });
    const token = service.createAccessToken(user.toJSON() as any);
    // await user.delete();
    await dbService.userModel.findByIdAndDelete(user._id);

    // Test
    let error: CustomBadRequestException;
    try {
      await service.refreshToken({ token });
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('unknown_user');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('register() should verify', async () => {
    // Test
    await service.register({
      email: TEST_DATA.email,
      password: TEST_DATA.password,
      name: 'Jane Doe',
    });

    const user = await dbService.userModel.findOne({ email: TEST_DATA.email });

    const isMatch = await bcrypt.compare(
      TEST_DATA.password,
      user.hashedPassword,
    );

    expect(user.email).toBe(TEST_DATA.email);
    expect(user.name).toBe('Jane Doe');
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerificationToken).toBeDefined();
    expect(isMatch).toBe(true);
  });

  it('register() duplicate email should fail', async () => {
    // Setup
    await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.register({
        email: TEST_DATA.email,
        password: TEST_DATA.password,
        name: 'Jane Doe',
      });
    } catch (err) {
      error = err;
    }

    expect(error.code).toBe('email_already_taken');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('verifyEmail() should verify', async () => {
    // Setup
    const emailVerificationToken = randomBytes(32).toString();
    const user = await dbService.userModel.create({
      email: TEST_DATA.email,
      isEmailVerified: false,
      emailVerificationToken,
    });

    // Test
    const { token } = await service.verifyEmail({
      verificationToken: emailVerificationToken,
    });
    const decoded = jwtService.decode(token) as DecodedToken;
    expect(decoded.id).toEqual(user.id);

    const updatedUser = await dbService.userModel.findOne({
      email: TEST_DATA.email,
    });
    expect(updatedUser.isEmailVerified).toBe(true);
    expect(updatedUser.emailVerificationToken).toBe(null);
  });

  it('verifyEmail() with invalid token should fail', async () => {
    // Setup
    await dbService.userModel.create({
      email: TEST_DATA.email,
      isEmailVerified: false,
      emailVerificationToken: randomBytes(32).toString(),
    });

    // Test
    let error: CustomBadRequestException;
    try {
      await service.verifyEmail({
        verificationToken: randomBytes(32).toString(),
      });
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('unkown_verification_token');
    expect(error).toBeInstanceOf(CustomBadRequestException);
  });

  it('verifyInvite() should verify', async () => {
    // Setup
    const projId = new Types.ObjectId();

    const user = await dbService.userModel.create({
      email: EXAMPLE_USER.email,
      name: EXAMPLE_USER.name,
      projects: [projId],
    });

    await dbService.projectModel.create({
      _id: projId,
      title: EXAMPLE_PROJECT.title,
      createdBy: user._id,
      inviteToken: EXAMPLE_PROJECT.inviteToken,
    });

    // Test
    const result = await service.verifyInvite(EXAMPLE_PROJECT.inviteToken);

    expect(result).toEqual({
      projectTitle: EXAMPLE_PROJECT.title,
      userName: EXAMPLE_USER.name,
    });
  });

  it('verifyInvite() Unknown invite token', async () => {
    // Setup

    // Test
    let error;
    try {
      await service.verifyInvite(EXAMPLE_PROJECT.inviteToken);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(400);
    expect(error.code).toBe('Unknown invite token');
  });

  it('verifyToken() should verify', () => {
    //Setup
    const spy_verify = jest
      .spyOn(jwtService, 'verify')
      .mockImplementation(jest.fn());

    const token = v4();
    //Test
    service.verifyToken(token);
    expect(spy_verify).toBeCalledTimes(1);
  });

  it('decodeToken() should verify', () => {
    //Setup
    const spy_decode = jest
      .spyOn(jwtService, 'decode')
      .mockImplementation(jest.fn());

    const token = v4();
    //Test
    service.decodeToken(token);
    expect(spy_decode).toBeCalledTimes(1);
  });

  it('findSystemAuthUser() should return system user', async () => {
    // Setup
    await dbService.userModel.create({
      role: UserRole.SYSTEM,
    });

    //Test
    const result = await service.findSystemAuthUser();

    expect(result.role).toBe(UserRole.SYSTEM);
  });

  it('findSystemAuthUser() system_user_not_found', async () => {
    //Setup
    //Test
    let error;
    try {
      await service.findSystemAuthUser();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.status).toBe(500);
    expect(error.code).toBe('system_user_not_found');
  });

  it('guestLogin() should verify', async () => {
    // Setup
    const project = await dbService.projectModel.create({
      _id: new Types.ObjectId(),
      title: EXAMPLE_PROJECT.title,
      inviteToken: EXAMPLE_PROJECT.inviteToken,
    });

    // Test
    const dto: AuthGuestLoginDto = {
      name: 'GUESTUSER',
      inviteToken: EXAMPLE_PROJECT.inviteToken,
    };
    const result = await service.guestLogin(dto);
    expect(result.token).toBeDefined();

    const guestuser = await dbService.userModel.findOne({
      name: 'GUESTUSER',
      role: UserRole.GUEST,
    });
    expect(guestuser).toBeDefined();
    expect(guestuser.projects).toContainEqual(project._id);
    const proj = await dbService.projectModel.findById(project._id);
    expect(proj.users).toContainEqual(guestuser._id);
  });

  it('createMediaAccessToken() shoudl return token', async () => {
    // Setup
    const projId = new Types.ObjectId();
    const user = await dbService.userModel.create({
      projects: [projId],
    });
    const authUser = {
      id: getObjectIdAsString(user._id),
      role: UserRole.USER,
    };

    await dbService.projectModel.create({
      _id: projId,
      users: user._id,
    });

    const mockedToken = v4();
    const spy_signJwt = jest
      .spyOn(jwtService, 'sign')
      .mockReturnValue(mockedToken);

    // Test
    const result = await service.createMediaAccessToken(authUser, {
      projectId: getObjectIdAsString(projId),
    });

    expect(spy_signJwt).toBeCalledTimes(1);
    expect(result).toEqual({ token: mockedToken });
  });
});
