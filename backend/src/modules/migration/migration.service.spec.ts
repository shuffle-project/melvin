import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { DbService } from '../db/db.service';
import { MigrationModule } from './migration.module';
import { MigrationService } from './migration.service';

describe('MigrationService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let dbService: DbService;

  let service: MigrationService;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, MigrationModule],
    }).compile();

    dbService = module.get<DbService>(DbService);
    service = module.get<MigrationService>(MigrationService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
