import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from 'src/modules/db/db.service';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TeamModule } from './team.module';
import { TeamService } from './team.service';

describe('TeamService', () => {
  let service: TeamService;
  let dbService: DbService;
  let MongooseTestModule: MongooseTestModule;
  let module: TestingModule;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, TeamModule],
    }).compile();

    dbService = module.get<DbService>(DbService);

    service = module.get<TeamService>(TeamService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
