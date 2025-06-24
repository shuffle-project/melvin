import { Test, TestingModule } from '@nestjs/testing';
import { MelvinTranslateService } from './melvin-translate.service';

describe('MelvinTranslateService', () => {
  let service: MelvinTranslateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MelvinTranslateService],
    }).compile();

    service = module.get<MelvinTranslateService>(MelvinTranslateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
