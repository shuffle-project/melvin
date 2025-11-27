import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
    })
      .useMocker((token) => {
        if (token === NotificationService) {
          return {
            findAll: jest.fn().mockImplementation((...args) => args),
            update: jest.fn().mockImplementation((...args) => args),
            remove: jest.fn().mockImplementation((...args) => args),
            bulkRemove: jest.fn().mockImplementation((...args) => args),
            updateMany: jest.fn().mockImplementation((...args) => args),
          };
        }
      })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

  it('update() should call service.update()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();
    const updateNotificationDto: any = v4();

    // Test
    const result = await controller.update(authUser, id, updateNotificationDto);
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(
      authUser,
      id,
      updateNotificationDto,
    );
    expect(result).toStrictEqual([authUser, id, updateNotificationDto]);
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

  it('bulkRemove() should call service.bulkRemove()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.bulkRemove(authUser, id);
    expect(service.bulkRemove).toHaveBeenCalledTimes(1);
    expect(service.bulkRemove).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });

  it('updateMany() should call service.updateMany()', async () => {
    // Setup
    const authUser: any = v4();
    const id: any = v4();

    // Test
    const result = await controller.updateMany(authUser, id);
    expect(service.updateMany).toHaveBeenCalledTimes(1);
    expect(service.updateMany).toHaveBeenCalledWith(authUser, id);
    expect(result).toStrictEqual([authUser, id]);
  });
});
