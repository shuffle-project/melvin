import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  createMongooseTestModule,
  MongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { UserRole } from '../../resources/user/user.interfaces';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';
import { UserDocument } from '../db/schemas/user.schema';
import { PermissionsModule } from './permissions.module';

describe('PermissionsService', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let service: PermissionsService;
  let dbService: DbService;

  let predefinedUser: UserDocument;
  let authUser: AuthUser;

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [
        ConfigTestModule,
        MongooseTestModule,
        PermissionsModule,
        DbModule,
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    dbService = module.get<DbService>(DbService);

    // Setup
    predefinedUser = await dbService.userModel.create({
      email: TEST_DATA.email,
      hashedPassword: TEST_DATA.hashedPassword,
    });
    authUser = {
      id: predefinedUser._id.toString(),
      role: predefinedUser.role,
      jwtId: TEST_DATA.validObjectId,
    };
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    // Test
    expect(service).toBeDefined();
  });

  it('isOwnProject() should verify is owner', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      createdBy: authUser.id,
    });

    //Test
    const bool = service.isProjectOwner(proj1, authUser);
    expect(bool).toBeTruthy();
  });

  it('isOwnProject() should verify is no owner', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: TEST_DATA.validObjectId,
    });

    //Test
    const bool = service.isProjectOwner(proj1, authUser);
    expect(bool).toBeFalsy();
  });

  it('isOwnProject() should verify system user', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({});
    const systemUser: AuthUser = { role: UserRole.SYSTEM } as any;

    //Test
    const bool = service.isProjectOwner(proj1, systemUser);
    expect(bool).toBeTruthy();
  });

  it('isProjectMember() should verify member of project', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [authUser.id],
      createdBy: TEST_DATA.validObjectId,
    });

    //Test
    const bool = service.isProjectMember(proj1, authUser);
    expect(bool).toBeTruthy();
  });

  it('isProjectMember() should not grant permission', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({
      title: TEST_DATA.project.title,
      users: [],
      createdBy: TEST_DATA.validObjectId,
    });

    //Test
    const bool = service.isProjectMember(proj1, authUser);
    expect(bool).toBeFalsy();
  });

  it('isProjectMember() should verify system user', async () => {
    //Setup
    const proj1 = await dbService.projectModel.create({});
    const systemUser: AuthUser = { role: UserRole.SYSTEM } as any;

    //Test
    const bool = service.isProjectMember(proj1, systemUser);
    expect(bool).toBeTruthy();
  });

  it('isTranscriptionOwner() should verify is transcription owner', async () => {
    //Setup
    const transc1 = await dbService.transcriptionModel.create({
      createdBy: authUser.id,
    });

    //Test
    const bool = service.isTranscriptionOwner(transc1, authUser);
    expect(bool).toBeTruthy();
  });

  it('isTranscriptionOwner() should verify is NOT transcription owner', async () => {
    //Setup
    const transc1 = await dbService.transcriptionModel.create({
      createdBy: TEST_DATA.validObjectId,
    });

    //Test
    const bool = service.isTranscriptionOwner(transc1, authUser);
    expect(bool).toBeFalsy();
  });

  it('isTranscriptionOwner() should verify is system user', async () => {
    //Setup
    const transc1 = await dbService.transcriptionModel.create({});
    const systemUser: AuthUser = { role: UserRole.SYSTEM } as any;

    //Test
    const bool = service.isTranscriptionOwner(transc1, systemUser);
    expect(bool).toBeTruthy();
  });
});
