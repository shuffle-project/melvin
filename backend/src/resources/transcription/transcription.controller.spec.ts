import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';

describe('TranscriptionController', () => {
  let controller: TranscriptionController;
  let service: TranscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptionController],
    })
      .useMocker((token) => {
        if (token === TranscriptionService) {
          return {
            create: jest.fn().mockImplementation((...args) => args),
            findAll: jest.fn().mockImplementation((...args) => args),
            findOne: jest.fn().mockImplementation((...args) => args),
            update: jest.fn().mockImplementation((...args) => args),
            remove: jest.fn().mockImplementation((...args) => args),
            createSpeakers: jest.fn().mockImplementation((...args) => args),
            updateSpeaker: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();
    service = module.get<TranscriptionService>(TranscriptionService);
    controller = module.get<TranscriptionController>(TranscriptionController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create()', async () => {
    // Setup
    const authUser: any = v4();
    const createTranscriptionDto: any = v4();
    // Test
    const result = await controller.create(authUser, createTranscriptionDto);
    expect(service.create).toBeCalledTimes(1);
    expect(service.create).toBeCalledWith(
      authUser,
      createTranscriptionDto,
      undefined,
    );
    expect(result).toStrictEqual([authUser, createTranscriptionDto, undefined]);
  });
  it('findAll() should call service.findAll()', async () => {
    // Setup
    const authUser: any = v4();
    const projectId: any = v4();
    // Test
    const result = await controller.findAll(authUser, projectId);
    expect(service.findAll).toBeCalledTimes(1);
    expect(service.findAll).toBeCalledWith(authUser, projectId);
    expect(result).toStrictEqual([authUser, projectId]);
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
    const updateTranscriptionDto: any = v4();
    // Test
    const result = await controller.update(
      authUser,
      id,
      updateTranscriptionDto,
    );
    expect(service.update).toBeCalledTimes(1);
    expect(service.update).toBeCalledWith(authUser, id, updateTranscriptionDto);
    expect(result).toStrictEqual([authUser, id, updateTranscriptionDto]);
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

  // speaker
  it('createSpeakers() should call service.createSpeakers()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const createSpeakersDto: any = v4();
    // Test
    const result = await controller.createSpeakers(
      authUser,
      id,
      createSpeakersDto,
    );
    expect(service.createSpeakers).toBeCalledTimes(1);
    expect(service.createSpeakers).toBeCalledWith(
      authUser,
      id,
      createSpeakersDto,
    );
    expect(result).toStrictEqual([authUser, id, createSpeakersDto]);
  });
  it('updateSpeaker() should call service.updateSpeaker()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const idSpeaker: any = v4();
    const updateSpeakerDto: any = v4();
    // Test
    const result = await controller.updateSpeaker(
      authUser,
      id,
      idSpeaker,
      updateSpeakerDto,
    );
    expect(service.updateSpeaker).toBeCalledTimes(1);
    expect(service.updateSpeaker).toBeCalledWith(
      authUser,
      id,
      idSpeaker,
      updateSpeakerDto,
    );
    expect(result).toStrictEqual([authUser, id, idSpeaker, updateSpeakerDto]);
  });
});
