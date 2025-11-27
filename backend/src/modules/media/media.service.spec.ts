import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { MediaModule } from './media.module';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let MongooseTestModule: MongooseTestModule;
  let module: TestingModule;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [MediaModule, ConfigTestModule, MongooseTestModule],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
