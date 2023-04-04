import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import { LoggerModule } from '../logger/logger.module';
import { PathService } from './path.service';

describe('PathService', () => {
  let service: PathService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigTestModule, LoggerModule],
      providers: [PathService],
    }).compile();

    service = module.get<PathService>(PathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getTempDirectory() should verify', () => {
    const result = service.getTempDirectory();
    expect(result).toMatch('temp');
  });

  it('getProjectDirectory() should verify', () => {
    const id = v4();
    const result = service.getProjectDirectory(id);
    expect(result).toMatch('projects');
    expect(result).toMatch(id);
  });

  it('getAssetsDirectory() should verify', () => {
    const result = service.getAssetsDirectory();
    expect(result).toMatch('assets');
  });

  it('getExampleProjectDirectory() should verify', () => {
    const result = service.getExampleProjectDirectory();
    expect(result).toMatch('assets');
    expect(result).toMatch('example-project');
  });

  it('getVideoFile() should verify', () => {
    const id = v4();
    const result = service.getVideoFile(id);
    expect(result).toMatch('projects');
    expect(result).toMatch(id);
    expect(result).toMatch('video.mp4');
  });

  it('getWaveformFile() should verify', () => {
    const id = v4();
    const result = service.getWaveformFile(id);
    expect(result).toMatch('projects');
    expect(result).toMatch(id);
    expect(result).toMatch('waveform.json');
  });
});
