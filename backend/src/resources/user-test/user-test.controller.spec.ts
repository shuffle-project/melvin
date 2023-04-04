import { Test, TestingModule } from '@nestjs/testing';
import { UserTestController } from './user-test.controller';
import { UserTestService } from './user-test.service';

describe('UserTestController', () => {
  let controller: UserTestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTestController],
      providers: [UserTestService],
    }).compile();

    controller = module.get<UserTestController>(UserTestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
