import { Test, TestingModule } from '@nestjs/testing';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { v4 } from 'uuid';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { TEST_DATA } from '../../../test/test.constants';
import { EditorUserColor } from '../../constants/editor.constants';
import { DbModule } from '../../modules/db/db.module';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { LoggerModule } from '../../modules/logger/logger.module';
import { getObjectIdAsString } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { CaptionEntity } from '../caption/entities/caption.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { ProjectEntity } from '../project/entities/project.entity';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  let module: TestingModule;
  let MongooseTestModule: MongooseTestModule;
  let gateway: EventsGateway;
  let mockClient: any;
  // let dbService: DbService;

  const authService = {
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();

    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, LoggerModule, DbModule],
      providers: [EventsGateway],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return authService;
        }
      })
      .compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    // dbService = module.get<DbService>(DbService);

    mockClient = {
      join: jest.fn(),
      data: {},
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      handshake: {
        auth: null,
      },
      disconnect: jest.fn(),
    };
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('_getUserRooms() should verify', async () => {
    // Setup
    const users = [
      new Types.ObjectId().toString(),
      new Types.ObjectId().toString(),
    ];
    const expected = users.map((o) => `user:${o}`);

    // Test
    const rooms = gateway._getUserRooms(users);
    expect(rooms).toStrictEqual(expected);
  });

  it('_getProjectRoom() should verify', async () => {
    // Setup
    const projectId = new Types.ObjectId().toString();

    // Test
    const rooms = gateway._getProjectRoom(projectId);
    expect(rooms).toStrictEqual(`project:${projectId}`);
  });

  it('_getSocketByUserId() should verify', async () => {
    // Setup
    const userId = new Types.ObjectId().toString();
    const sockets = [
      { data: { userId: new Types.ObjectId() } } as any,
      { data: { userId: userId } } as any,
      { data: { userId: new Types.ObjectId() } } as any,
    ];

    gateway.server = { fetchSockets: jest.fn() } as any;
    const spy_fetchSockets = jest
      .spyOn(gateway.server, 'fetchSockets')
      .mockResolvedValue(sockets);

    // Test
    const result = await gateway._getSocketByUserId(userId);
    expect(spy_fetchSockets).toBeCalledTimes(1);
    expect(result).toBeDefined();
    expect(result).toStrictEqual({ data: { userId: userId } });
  });

  it('_getSocketByUserId() return undefiend', async () => {
    // Setup
    const userId = new Types.ObjectId().toString();
    const sockets = [
      { data: { userId: new Types.ObjectId() } } as any,
      { data: { userId: new Types.ObjectId() } } as any,
      { data: { userId: new Types.ObjectId() } } as any,
    ];

    gateway.server = { fetchSockets: jest.fn() } as any;
    const spy_fetchSockets = jest
      .spyOn(gateway.server, 'fetchSockets')
      .mockResolvedValue(sockets);

    // Test
    const result = await gateway._getSocketByUserId(userId);
    expect(spy_fetchSockets).toBeCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('_broadcast() should verify', async () => {
    // TODO
  });

  it('_join() should verify', async () => {
    // Setup
    const socket = { join: jest.fn() } as any;

    const spy_joinSocket = jest.spyOn(socket, 'join');
    const spy_getSocketByUserId = jest
      .spyOn(gateway, '_getSocketByUserId')
      .mockResolvedValue(socket);

    const userid = v4();
    const room = v4();

    // Test
    await gateway._join(userid, room);
    expect(spy_getSocketByUserId).toBeCalledWith(userid);
    expect(spy_joinSocket).toBeCalledWith(room);
  });

  it('_join() throw Error user_socket_not_found', async () => {
    // Setup
    const spy_getSocketByUserId = jest
      .spyOn(gateway, '_getSocketByUserId')
      .mockResolvedValue(undefined);

    const userid = v4();
    const room = v4();

    // Test
    let error: Error;
    try {
      await gateway._join(userid, room);
    } catch (err) {
      error = err;
    }
    expect(spy_getSocketByUserId).toBeCalledWith(userid);
    expect(error).toBeDefined();
    expect(error.message).toBe('user_socket_not_found');
  });

  it('_leave() should verify', async () => {
    // Setup
    const socket = { leave: jest.fn() } as any;

    const spy_leaveSocket = jest.spyOn(socket, 'leave');
    const spy_getSocketByUserId = jest
      .spyOn(gateway, '_getSocketByUserId')
      .mockResolvedValue(socket);

    const userid = v4();
    const room = v4();

    // Test
    await gateway._leave(userid, room);
    expect(spy_getSocketByUserId).toBeCalledWith(userid);
    expect(spy_leaveSocket).toBeCalledWith(room);
  });

  it('_leave() throw Error user_socket_not_found', async () => {
    // Setup
    const spy_getSocketByUserId = jest
      .spyOn(gateway, '_getSocketByUserId')
      .mockResolvedValue(undefined);

    const userid = v4();
    const room = v4();

    // Test
    let error: Error;
    try {
      await gateway._leave(userid, room);
    } catch (err) {
      error = err;
    }
    expect(spy_getSocketByUserId).toBeCalledWith(userid);
    expect(error).toBeDefined();
    expect(error.message).toBe('user_socket_not_found');
  });

  it('_getActiveUsers() should verify', () => {
    // TODO
  });

  it('handleConnection() should add user id to socket and join user room', async () => {
    // Setup
    const userId = new Types.ObjectId();
    mockClient.handshake.auth = { token: TEST_DATA.token };
    authService.verifyToken.mockReturnValueOnce({ id: userId });

    // Test
    await gateway.handleConnection(mockClient);

    expect(authService.verifyToken).toBeCalledWith(TEST_DATA.token);
    expect(mockClient.join).toHaveBeenCalledWith(`user:${userId}`);
    expect(mockClient.data).toStrictEqual({ userColor: null, userId });
  });

  it('handleDisconnecting() should verify', async () => {
    // Setup
    const userId = v4();
    const id1 = v4();
    const id2 = v4();

    const typedSocket = {
      data: { userId },
      rooms: ['user:a', `project:${id1}`, 'user:b', `project:${id2}`],
    } as any;

    const spy_leaveProjectRoom = jest
      .spyOn(gateway, '_leaveProjectRoom')
      .mockImplementation(jest.fn());

    // Test
    await gateway.handleDisconnecting(typedSocket);

    expect(spy_leaveProjectRoom).toHaveBeenCalledTimes(2);
    expect(spy_leaveProjectRoom).toHaveBeenCalledWith(id1, userId);
    expect(spy_leaveProjectRoom).toHaveBeenCalledWith(id2, userId);
  });

  it('joinProjectRoom() should verify', async () => {
    // Setup
    const authUser = { id: new Types.ObjectId().toString() } as AuthUser;
    const project = { _id: new Types.ObjectId() } as ProjectEntity;
    const activeUsers = [{ id: v4(), color: EditorUserColor.PURPLE }];

    const spy_join = jest.spyOn(gateway, '_join').mockImplementation(jest.fn());
    const spy_getActiveUsers = jest
      .spyOn(gateway, '_getActiveUsers')
      .mockReturnValue(activeUsers);
    const spy_broadcast = jest
      .spyOn(gateway, '_broadcast')
      .mockImplementation(jest.fn());

    // Test
    await gateway.joinProjectRoom(authUser, project);

    const projectRoom = `project:${getObjectIdAsString(project)}`;
    expect(spy_join).toBeCalledWith(authUser.id, projectRoom);
    expect(spy_getActiveUsers).toBeCalledWith(projectRoom);
    expect(spy_broadcast).toBeCalledWith([projectRoom], 'project:user-joined', {
      userId: authUser.id,
      activeUsers,
    });
  });

  it('leaveProjectRoom() should verify', async () => {
    // Setup
    const spy_leaveProjectRoom = jest
      .spyOn(gateway, '_leaveProjectRoom')
      .mockImplementation(jest.fn());

    const authUser = { id: new Types.ObjectId().toString() } as AuthUser;
    const project = { _id: new Types.ObjectId() } as ProjectEntity;

    //Test
    await gateway.leaveProjectRoom(authUser, project);
    expect(spy_leaveProjectRoom).toBeCalledWith(
      getObjectIdAsString(project),
      authUser.id,
    );
  });

  it('_leaveProjectRoom() should verify', async () => {
    // Setup
    const userId = v4();
    const projectId = v4();
    const activeUsers = [{ id: v4(), color: EditorUserColor.PURPLE }];

    const spy_leave = jest
      .spyOn(gateway, '_leave')
      .mockImplementation(jest.fn());
    const spy_getActiveUsers = jest
      .spyOn(gateway, '_getActiveUsers')
      .mockReturnValue(activeUsers);
    const spy_broadcast = jest
      .spyOn(gateway, '_broadcast')
      .mockImplementation(jest.fn());
    const spy_unlockAllCaptions = jest
      .spyOn(gateway, '_unlockAllCaptions')
      .mockImplementation(jest.fn());

    // Test
    await gateway._leaveProjectRoom(projectId, userId);

    const projectRoom = `project:${projectId}`;
    expect(spy_leave).toBeCalledWith(userId, projectRoom);
    expect(spy_getActiveUsers).toBeCalledWith(projectRoom);
    expect(spy_unlockAllCaptions).toBeCalled();
    expect(spy_broadcast).toBeCalledWith([projectRoom], 'project:user-left', {
      userId,
      activeUsers,
    });
  });

  it('projectCreated() should verify', async () => {
    // Setup
    const entity = plainToInstance(ProjectEntity, {
      _id: new Types.ObjectId(),
      users: [
        {
          _id: new Types.ObjectId(),
        },
        {
          _id: new Types.ObjectId(),
        },
      ],
    });

    const rooms = entity.users.map((o) => `user:${o}`);
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.projectCreated(entity);
    expect(gateway._getUserRooms).toBeCalledWith(
      entity.users.map((o) => getObjectIdAsString(o._id)),
    );
    expect(gateway._broadcast).toBeCalledWith(rooms, 'project:created', {
      project: instanceToPlain(entity),
    });
  });

  it('projectUpdated() should verify', async () => {
    // Setup
    const entity = plainToInstance(ProjectEntity, {
      _id: new Types.ObjectId(),
      users: [
        {
          _id: new Types.ObjectId(),
        },
        {
          _id: new Types.ObjectId(),
        },
      ],
    });

    const rooms = entity.users.map((o) => `user:${o}`);
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.projectUpdated(entity);
    expect(gateway._getUserRooms).toBeCalledWith(
      entity.users.map((o) => getObjectIdAsString(o._id)),
    );
    expect(gateway._broadcast).toBeCalledWith(rooms, 'project:updated', {
      project: instanceToPlain(entity),
    });
  });

  it('projectRemoved() should verify', async () => {
    // Setup
    const project = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    } as LeanProjectDocument;
    const rooms = project.users.map((o) => `user:${o}`);
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.projectRemoved(project);
    expect(gateway._getUserRooms).toBeCalledWith(
      project.users.map((o) => getObjectIdAsString(o)),
    );
    expect(gateway._broadcast).toBeCalledWith(rooms, 'project:removed', {
      projectId: project._id.toString(),
    });
  });

  it('transcriptionCreated() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const transcription: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.transcriptionCreated(project, transcription);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'transcription:created', {
      transcription: instanceToPlain(transcription) as TranscriptionEntity,
    });
  });

  it('transcriptionUpdated() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const transcription: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.transcriptionUpdated(project, transcription);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'transcription:updated', {
      transcription: instanceToPlain(transcription) as TranscriptionEntity,
    });
  });

  it('transcriptionRemoved() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const transcription: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.transcriptionRemoved(project, transcription);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'transcription:removed', {
      transcriptionId: transcription._id.toString(),
    });
  });

  it('captionCreated() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const caption: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.captionCreated(project, caption);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'caption:created', {
      caption: instanceToPlain(caption) as CaptionEntity,
    });
  });

  it('captionUpdated() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const caption: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.captionUpdated(project, caption);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'caption:updated', {
      caption: instanceToPlain(caption) as CaptionEntity,
    });
  });

  it('captionRemoved() should verify', async () => {
    //Setup
    const project: any = {
      _id: new Types.ObjectId(),
      users: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const caption: any = {
      _id: new Types.ObjectId(),
      project: project._id,
    };
    const room = `project:${project._id}`;
    jest.spyOn(gateway, '_getProjectRoom').mockImplementation(() => room);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.captionRemoved(project, caption);
    expect(gateway._getProjectRoom).toBeCalledWith(project._id.toString());
    expect(gateway._broadcast).toBeCalledWith([room], 'caption:removed', {
      captionId: caption._id.toString(),
    });
  });

  it('notificationCreated() should verify', async () => {
    // Setup
    const entity = plainToInstance(NotificationEntity, {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(),
    });

    const userid = getObjectIdAsString(entity.user);

    const rooms = [`user:${userid}`];
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.notificationCreated(entity);

    expect(gateway._getUserRooms).toBeCalledWith([userid]);
    expect(gateway._broadcast).toBeCalledWith(rooms, 'notification:created', {
      notification: instanceToPlain(entity),
    });
  });

  it('notificationsUpdated() should verify', async () => {
    // Setup
    const entity = plainToInstance(NotificationEntity, {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(),
    });

    const userid = getObjectIdAsString(entity.user);

    const rooms = [`user:${userid}`];
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.notificationsUpdated(userid, [entity]);

    expect(gateway._getUserRooms).toBeCalledWith([userid]);
    expect(gateway._broadcast).toBeCalledWith(rooms, 'notifications:updated', {
      notifications: [instanceToPlain(entity)],
    });
  });

  it('notificationsRemoved() should verify', async () => {
    // Setup
    const entity = plainToInstance(NotificationEntity, {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(),
    });

    const userid = getObjectIdAsString(entity.user);
    const notificationId = getObjectIdAsString(entity);

    const rooms = [`user:${userid}`];
    jest.spyOn(gateway, '_getUserRooms').mockImplementation(() => rooms);
    jest.spyOn(gateway, '_broadcast').mockImplementation(jest.fn());

    // Test
    await gateway.notificationsRemoved(userid, [notificationId]);

    expect(gateway._getUserRooms).toBeCalledWith([userid]);
    expect(gateway._broadcast).toBeCalledWith(rooms, 'notifications:removed', {
      notificationIds: [notificationId],
    });
  });
});
