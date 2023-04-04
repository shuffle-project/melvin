import { Test, TestingModule } from '@nestjs/testing';
import { LivestreamController } from './livestream.controller';
import { LivestreamService } from './livestream.service';

describe('LivestreamController', () => {
  let controller: LivestreamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivestreamController],
      providers: [LivestreamService],
    }).compile();

    controller = module.get<LivestreamController>(LivestreamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
