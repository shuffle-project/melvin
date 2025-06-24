import { Test, TestingModule } from '@nestjs/testing';
import { MelvinAsrApiService } from './melvin-asr-api.service';

describe('MelvinAsrApiService', () => {
  let service: MelvinAsrApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MelvinAsrApiService],
    }).compile();

    service = module.get<MelvinAsrApiService>(MelvinAsrApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
