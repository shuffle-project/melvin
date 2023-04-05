import { Test, TestingModule } from '@nestjs/testing';
import { LivestreamController } from './livestream.controller';
import { LivestreamService } from './livestream.service';

describe('LivestreamController', () => {
  let controller: LivestreamController;
  let service: LivestreamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivestreamController],
    })
      .useMocker((token) => {
        if (token === LivestreamService) {
          return {
            connect: jest.fn().mockImplementation((...args) => args),
            start: jest.fn().mockImplementation((...args) => args),
            pause: jest.fn().mockImplementation((...args) => args),
            resume: jest.fn().mockImplementation((...args) => args),
            stop: jest.fn().mockImplementation((...args) => args),
            startRecording: jest.fn().mockImplementation((...args) => args),
            stopRecording: jest.fn().mockImplementation((...args) => args),
            pauseRecording: jest.fn().mockImplementation((...args) => args),
            resumeRecording: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();

    controller = module.get<LivestreamController>(LivestreamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO TESTS
});
