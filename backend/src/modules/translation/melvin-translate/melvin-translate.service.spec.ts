import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../../test/mongoose-test.module';
import { TranslationModule } from '../translation.module';
import { MelvinTranslateService } from './melvin-translate.service';

describe('MelvinTranslateService', () => {
  let service: MelvinTranslateService;
  let MongooseTestModule: MongooseTestModule;
  let module: TestingModule;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();
    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, TranslationModule],
    }).compile();

    service = module.get<MelvinTranslateService>(MelvinTranslateService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
