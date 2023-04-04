import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { DbModule } from '../db/db.module';
import { MigrationService } from './migration.service';

describe('MigrationService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;

  let service: MigrationService;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, DbModule],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
