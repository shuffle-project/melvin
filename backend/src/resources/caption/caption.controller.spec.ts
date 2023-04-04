import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { CaptionController } from './caption.controller';
import { CaptionService } from './caption.service';

describe('CaptionController', () => {
  let controller: CaptionController;
  let service: CaptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaptionController],
    })
      .useMocker((token) => {
        if (token === CaptionService) {
          return {
            create: jest.fn().mockImplementation((...args) => args),
            findAll: jest.fn().mockImplementation((...args) => args),
            findOne: jest.fn().mockImplementation((...args) => args),
            update: jest.fn().mockImplementation((...args) => args),
            remove: jest.fn().mockImplementation((...args) => args),
            getHistory: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();

    controller = module.get<CaptionController>(CaptionController);
    service = module.get<CaptionService>(CaptionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create()', async () => {
    // Setup
    const authUser: any = v4();
    const createCaptionDto: any = v4();

    // Test
    const result = await controller.create(authUser, createCaptionDto);
    expect(service.create).toBeCalledTimes(1);
    expect(service.create).toBeCalledWith(authUser, createCaptionDto);
    expect(result).toStrictEqual([authUser, createCaptionDto]);
  });

  it('findAll() should call service.findAll()', async () => {
    // Setup
    const authUser: any = v4();
    const query: any = v4();

    // Test
    const result = await controller.findAll(authUser, query);
    expect(service.findAll).toBeCalledTimes(1);
    expect(service.findAll).toBeCalledWith(authUser, query);
    expect(result).toStrictEqual([authUser, query]);
  });

  it('findOne() should call service.findOne()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.findOne(authUser, id);
    expect(service.findOne).toBeCalledTimes(1);
    expect(service.findOne).toBeCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('update() should call service.update()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const updateCaptionDto: any = v4();

    // Test
    const result = await controller.update(authUser, id, updateCaptionDto);
    expect(service.update).toBeCalledTimes(1);
    expect(service.update).toBeCalledWith(authUser, id, updateCaptionDto);
    expect(result).toStrictEqual([authUser, id, updateCaptionDto]);
  });

  it('remove() should call service.remove()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.remove(authUser, id);
    expect(service.remove).toBeCalledTimes(1);
    expect(service.remove).toBeCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('getHistory() should call service.getHistory()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.getHistory(authUser, id);
    expect(service.getHistory).toBeCalledTimes(1);
    expect(service.getHistory).toBeCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });
});
