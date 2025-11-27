import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { FfmpegModule } from './ffmpeg.module';
import { FfmpegService } from './ffmpeg.service';

describe('FfmpegService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: FfmpegService;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        LoggerModule,
        PathModule,
        FfmpegModule,
      ],
    }).compile();

    service = module.get<FfmpegService>(FfmpegService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('_normalizeData()', () => {
    // SETUP
    const maximum = 100;
    //values from 50-100, length 51
    const reducedData = new Array(51).fill(0).map((value, index) => index + 50);
    const waveformNormalizedMax = 10;

    // TEST
    const result = service._normalizeData(
      maximum,
      reducedData,
      waveformNormalizedMax,
    );

    expect(result.max).toBe(10);
    expect(result.min).toBe(5);
    expect(result.values).toHaveLength(51);
  });

  it('_reduceSampleRate()', () => {
    // SETUP
    //values from 50-100, length 51
    const data = new Array(51).fill(0).map((value, index) => index + 50);
    const analyzingSamplerate = 10;
    const storedSamplesPerSecond = 2;

    // TEST
    const result = service._reduceSampleRate(
      data,
      analyzingSamplerate,
      storedSamplesPerSecond,
    );

    expect(result.maximum).toBe(97);
    expect(result.reducedData).toHaveLength(analyzingSamplerate);
  });
});
