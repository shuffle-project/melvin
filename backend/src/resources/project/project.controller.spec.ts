import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import { PathModule } from '../../modules/path/path.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigTestModule, PathModule],
      controllers: [ProjectController],
    })
      .useMocker((token) => {
        if (token === ProjectService) {
          return {
            create: jest.fn().mockImplementation((...args) => args),
            findAll: jest.fn().mockImplementation((...args) => args),
            findOne: jest.fn().mockImplementation((...args) => args),
            update: jest.fn().mockImplementation((...args) => args),
            remove: jest.fn().mockImplementation((...args) => args),
            joinProject: jest.fn().mockImplementation((...args) => args),
            subscribe: jest.fn().mockImplementation((...args) => args),
            unsubscribe: jest.fn().mockImplementation((...args) => args),
            invite: jest.fn().mockImplementation((...args) => args),
            getInviteToken: jest.fn().mockImplementation((...args) => args),
            updateInviteToken: jest.fn().mockImplementation((...args) => args),
            getWaveformData: jest.fn().mockImplementation((...args) => args),
            getVideoChunk: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create()', async () => {
    // Setup
    const authUser: any = v4();
    const createProjectDto: any = v4();
    const files: any = v4();

    // Test
    const result = await controller.create(authUser, createProjectDto);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(authUser, createProjectDto);
    expect(result).toStrictEqual([authUser, createProjectDto]);
  });

  it('findAll() should call service.findAll()', async () => {
    // Setup
    const authUser: any = v4();
    const query: any = v4();

    // Test
    const result = await controller.findAll(authUser, query);
    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(service.findAll).toHaveBeenCalledWith(authUser, query);
    expect(result).toStrictEqual([authUser, query]);
  });

  it('findOne() should call service.findOne()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.findOne(authUser, id);
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('update() should call service.update()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const updateProjectDto: any = v4();

    // Test
    const result = await controller.update(authUser, id, updateProjectDto);
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(authUser, id, updateProjectDto);
    expect(result).toStrictEqual([authUser, id, updateProjectDto]);
  });

  it('remove() should call service.remove()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.remove(authUser, id);
    expect(service.remove).toHaveBeenCalledTimes(1);
    expect(service.remove).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('subscribe() should call service.subscribe()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.subscribe(authUser, id);
    expect(service.subscribe).toHaveBeenCalledTimes(1);
    expect(service.subscribe).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('unsubscribe() should call service.unsubscribe()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.unsubscribe(authUser, id);
    expect(service.unsubscribe).toHaveBeenCalledTimes(1);
    expect(service.unsubscribe).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('invite() should call service.invite()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const inviteDto: any = v4();

    // Test
    const result = await controller.invite(authUser, id, inviteDto);
    expect(service.invite).toHaveBeenCalledTimes(1);
    expect(service.invite).toHaveBeenCalledWith(authUser, id, inviteDto);
    expect(result).toStrictEqual([authUser, id, inviteDto]);
  });

  it('getInviteToken() should call service.getInviteToken()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.getInviteToken(authUser, id);
    expect(service.getInviteToken).toHaveBeenCalledTimes(1);
    expect(service.getInviteToken).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('updateInviteToken() should call service.updateInviteToken()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.updateInviteToken(authUser, id);
    expect(service.updateInviteToken).toHaveBeenCalledTimes(1);
    expect(service.updateInviteToken).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });
});
