import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
    })
      .useMocker((token) => {
        if (token === ActivityService) {
          return {
            findAll: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll() should call service.findAll()', async () => {
    // Setup
    const authUser: any = v4();
    const query: any = v4();

    // Test
    const result = await controller.findAll(authUser, query);
    expect(service.findAll).toBeCalledTimes(1);
    expect(service.findAll).toBeCalledWith(authUser, query);
    expect(result).toStrictEqual([authUser, query]);
  });
});
