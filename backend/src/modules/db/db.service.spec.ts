import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { CustomBadRequestException } from '../../utils/exceptions';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';

describe('PermissionsService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let dbService: DbService;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, DbModule],
    }).compile();

    dbService = module.get<DbService>(DbService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(dbService).toBeDefined();
  });

  it('findProjectByIdOrThrow() should verify', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
    });
    //Test
    const requestedProj = await dbService.findProjectByIdOrThrow(
      proj1._id.toString(),
    );
    expect(requestedProj._id).toStrictEqual(proj1._id);
  });

  it('findProjectByIdOrThrow() should throw unknown_project_id', async () => {
    //Setup
    //Test
    let error: CustomBadRequestException;
    try {
      await dbService.findProjectByIdOrThrow(TEST_DATA.validObjectId);
    } catch (err) {
      error = err;
    }
    expect(error.code).toBe('unknown_project_id');
  });
});
