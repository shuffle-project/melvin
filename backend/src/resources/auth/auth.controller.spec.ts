import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return {
            login: jest.fn().mockImplementation((args) => args),
            refreshToken: jest.fn().mockImplementation((args) => args),
            createMediaAccessToken: jest
              .fn()
              .mockImplementation((...args) => args),
            register: jest.fn().mockImplementation((args) => args),
            verifyEmail: jest.fn().mockImplementation((args) => args),
            guestLogin: jest.fn().mockImplementation((args) => args),
            verifyInvite: jest.fn().mockImplementation((args) => args),
          };
        }
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    // Test
    expect(controller).toBeDefined();
  });

  it('login() should call authService.login()', async () => {
    // Setup
    const dto: any = v4();

    // Test
    const result = await controller.login(dto);
    expect(service.login).toBeCalledTimes(1);
    expect(service.login).toBeCalledWith(dto);
    expect(result).toStrictEqual(dto);
  });

  it('refreshToken() should call authService.refreshToken()', async () => {
    // Setup
    const dto: any = v4();

    // Test
    const result = await controller.refreshToken(dto);
    expect(service.refreshToken).toBeCalledTimes(1);
    expect(service.refreshToken).toBeCalledWith(dto);
    expect(result).toStrictEqual(dto);
  });

  it('createMediaAccessToken() should call authService.createMediaAccessToken()', async () => {
    // Setup
    const authUser: any = v4();
    const dto: any = v4();

    // Test
    const result = await controller.createMediaAccessToken(authUser, dto);
    expect(service.createMediaAccessToken).toBeCalledTimes(1);
    expect(service.createMediaAccessToken).toBeCalledWith(authUser, dto);
    expect(result).toStrictEqual([authUser, dto]);
  });

  it('register() should call authService.register()', async () => {
    // Setup
    const dto: any = v4();

    // Test
    const result = await controller.register(dto);
    expect(service.register).toBeCalledTimes(1);
    expect(service.register).toBeCalledWith(dto);
    expect(result).toStrictEqual(dto);
  });

  it('verifyEmail() should call authService.verifyEmail()', async () => {
    // Setup
    const dto: any = v4();

    // Test
    const result = await controller.verifyEmail(dto);
    expect(service.verifyEmail).toBeCalledTimes(1);
    expect(service.verifyEmail).toBeCalledWith(dto);
    expect(result).toStrictEqual(dto);
  });

  it('guestLogin() should call authService.guestLogin()', async () => {
    // Setup
    const dto: any = v4();

    // Test
    const result = await controller.guestLogin(dto);
    expect(service.guestLogin).toBeCalledTimes(1);
    expect(service.guestLogin).toBeCalledWith(dto);
    expect(result).toStrictEqual(dto);
  });

  it('verifyInvite() should call authService.verifyInvite()', async () => {
    // Setup
    const inviteToken: any = v4();

    // Test
    const result = await controller.verifyInvite(inviteToken);
    expect(service.verifyInvite).toBeCalledTimes(1);
    expect(service.verifyInvite).toBeCalledWith(inviteToken);
    expect(result).toStrictEqual(inviteToken);
  });
});
