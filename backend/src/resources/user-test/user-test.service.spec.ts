import { Test, TestingModule } from '@nestjs/testing';
import { UserTestService } from './user-test.service';

describe('UserTestService', () => {
  let service: UserTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserTestService],
    }).compile();

    service = module.get<UserTestService>(UserTestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
