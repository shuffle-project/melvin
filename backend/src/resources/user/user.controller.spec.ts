import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    })
      .useMocker((token) => {
        if (token === UserService) {
          return {
            findAll: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();
    service = module.get<UserService>(UserService);
    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll() should call service.findAll()', async () => {
    // Setup
    const search: any = v4();

    // Test
    const result = await controller.findAll({ search });
    expect(service.findAll).toBeCalledTimes(1);
    expect(service.findAll).toBeCalledWith({ search });
    expect(result).toStrictEqual([{ search }]);
  });
});
