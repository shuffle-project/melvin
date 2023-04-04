import { Test, TestingModule } from '@nestjs/testing';
import { LivestreamService } from './livestream.service';

describe('LivestreamService', () => {
  let service: LivestreamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LivestreamService],
    }).compile();

    service = module.get<LivestreamService>(LivestreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
