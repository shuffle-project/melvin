import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TasksModule } from './tasks.module';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let MongooseTestModule: MongooseTestModule;
  let module: TestingModule;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [TasksModule, MongooseTestModule, ConfigTestModule],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
