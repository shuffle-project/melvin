import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { MelvinAsrApiModule } from './melvin-asr-api.module';
import { MelvinAsrApiService } from './melvin-asr-api.service';

describe('MelvinAsrApiService', () => {
  let service: MelvinAsrApiService;
  let MongooseTestModule: MongooseTestModule;
  let module: TestingModule;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [MelvinAsrApiModule, ConfigTestModule, MongooseTestModule],
    }).compile();

    service = module.get<MelvinAsrApiService>(MelvinAsrApiService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
