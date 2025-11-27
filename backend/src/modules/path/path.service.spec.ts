import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { EXAMPLE_AUDIO, EXAMPLE_VIDEO } from 'src/constants/example.constants';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import { Audio, Video } from '../db/schemas/project.schema';
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
    const result = service.getTempDirectory('some-id');
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
    const video: Video = {
      ...EXAMPLE_VIDEO,
      _id: new Types.ObjectId(EXAMPLE_VIDEO._id),
    } as Video;
    const result = service.getVideoFile(id, video);
    expect(result).toMatch('projects');
    expect(result).toMatch(id);
    expect(result).toMatch('.mp4');
  });

  it('getWaveformFile() should verify', () => {
    const id = v4();
    const audio: Audio = {
      ...EXAMPLE_AUDIO,
      _id: new Types.ObjectId(EXAMPLE_AUDIO._id),
    } as Audio;
    const result = service.getWaveformFile(id, audio);
    expect(result).toMatch('projects');
    expect(result).toMatch(id);
    expect(result).toMatch('.json');
  });
});
