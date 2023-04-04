import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Subject } from 'rxjs';
import { RemoteSocket } from 'socket.io';
import { EventNames, EventParams } from 'socket.io/dist/typed-events';
import {
  AVAILABLE_EDITOR_USER_COLORS,
  EditorActiveUser,
  EditorUserColor,
} from '../../constants/editor.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { getObjectIdAsString, isSameObjectId } from '../../utils/objectid';
import { AuthUser, DecodedToken } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { CaptionEntity } from '../caption/entities/caption.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { UpdatePartialProjectDto } from '../project/dto/update-partial-project.dto';
import { ProjectEntity } from '../project/entities/project.entity';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';
import {
  ServerToClientEvents,
  SocketData,
  TypedServer,
  TypedSocket,
} from './events.interfaces';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection {
  public onClientIceCandidate$ = new Subject<{
    userId: string;
    projectId: string;
    candidate: string;
  }>();

  constructor(
    private authService: AuthService,
    private logger: CustomLogger,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @WebSocketServer() public server: TypedServer;

  // Helper

  _getUserRooms(users: string[]): string[] {
    return users.map((userId) => `user:${userId}`);
  }

  _getProjectRoom(projectId: string): string {
    return `project:${projectId}`;
  }

  async _getSocketByUserId(
    userId: string,
  ): Promise<RemoteSocket<any, SocketData> | undefined> {
    const sockets = await this.server.fetchSockets();
    return sockets.find((o) => isSameObjectId(o.data.userId, userId));
  }

  _broadcast<Ev extends EventNames<ServerToClientEvents>>(
    rooms: string[],
    event: Ev,
    ...args: EventParams<ServerToClientEvents, Ev>
  ): boolean {
    const activeRooms = rooms.filter((room) =>
      this.server.sockets.adapter.rooms.has(room),
    );
    if (activeRooms.length > 0) {
      return this.server.to(activeRooms).emit(event, ...args);
    }
  }

  async _join(userId: string, room: string): Promise<void> {
    const socket = await this._getSocketByUserId(userId);
    if (!socket) {
      throw new Error('user_socket_not_found');
    }
    socket.join(room);
  }

  async _leave(userId: string, room: string): Promise<void> {
    const socket = await this._getSocketByUserId(userId);
    if (!socket) {
      throw new Error('user_socket_not_found');
    }
    socket.leave(room);
  }

  async _leaveProjectRoom(projectId: string, userId: string) {
    const room = this._getProjectRoom(projectId);
    await this._leave(userId, room);

    const activeUsers: EditorActiveUser[] = this._getActiveUsers(room);

    await this._unlockAllCaptions(projectId, userId);

    this._broadcast([room], 'project:user-left', {
      userId,
      activeUsers,
    });
  }

  async _unlockAllCaptions(projectId: string, userId: string) {
    // TODO quickfix, pls refactor me
    const lockedByUser = await this.db.captionModel
      .find({
        project: projectId,
        lockedBy: userId,
      })
      .lean()
      .exec();

    await this.db.captionModel
      .updateMany(
        { project: projectId, lockedBy: userId },
        {
          $set: {
            lockedBy: null,
          },
        },
      )
      .exec();

    await Promise.all(
      lockedByUser.map((caption) => {
        caption.lockedBy = null;
        return this.captionUpdatedProjId(
          projectId,
          plainToInstance(CaptionEntity, caption),
        );
      }),
    );
  }

  _getActiveUsers(room: string) {
    const clients = this.server.sockets.adapter.rooms.get(room);
    if (clients === undefined) {
      return [];
    }

    const activeUsers = [...clients].map((clientId) => {
      return {
        id: this.server.sockets.sockets.get(clientId).data.userId,
        color: this.server.sockets.sockets.get(clientId).data.userColor,
        clientId: clientId,
      };
    });

    const countingUsedColors = AVAILABLE_EDITOR_USER_COLORS.map((color) => ({
      color,
      count: activeUsers.filter((user) => user.color === color).length,
    }));

    let smallestCount = countingUsedColors[0].count;
    let availableColors: EditorUserColor[] = [];
    countingUsedColors.forEach((usedColor, index) => {
      if (smallestCount > countingUsedColors[index].count) {
        availableColors = countingUsedColors
          .filter((o) => o.count === countingUsedColors[index].count)
          .map((o) => o.color);
        smallestCount = countingUsedColors[index].count;
      }
    });

    const editorActiveUsers: EditorActiveUser[] = activeUsers.map((user) => {
      if (!user.color) {
        if (availableColors.length === 0) {
          availableColors.push(...AVAILABLE_EDITOR_USER_COLORS);
        }

        const newColor = availableColors.shift();
        user.color = newColor;
        this.server.sockets.sockets.get(user.clientId).data.userColor =
          newColor;
      }
      return { id: user.id, color: user.color } as EditorActiveUser;
    });

    return editorActiveUsers;
  }

  // ClientToServerEvents

  async handleConnection(
    @ConnectedSocket() socket: TypedSocket,
  ): Promise<void> {
    try {
      const { token } = socket.handshake.auth;
      const dtoken: DecodedToken = this.authService.verifyToken(token);
      socket.data.userId = dtoken.id;
      socket.join(`user:${dtoken.id}`);
      socket.data.userColor = null;

      // leave room on disconnecting
      socket.on('disconnecting', () => this.handleDisconnecting(socket));
    } catch (err) {
      this.logger.verbose('invalid credentials');
      socket.emit('connection:invalid-credentials', {
        message: 'Invalid credentials',
      });
      socket.disconnect(true);
    }
  }

  async handleDisconnecting(socket: TypedSocket) {
    const rooms = [...socket.rooms].filter((o) => o.startsWith('project:'));

    // leave all rooms
    await Promise.all([
      rooms.map((room) => {
        const roomId = room.split(':')[1];
        return this._leaveProjectRoom(roomId, socket.data.userId);
      }),
    ]);
  }

  @SubscribeMessage('livestream:client-ice-candidate')
  async clientIceCandidate(
    @ConnectedSocket() socket: TypedSocket,
    @MessageBody() data: { candidate: string; projectId: string },
  ) {
    this.onClientIceCandidate$.next({
      userId: socket.data.userId,
      projectId: data.projectId,
      candidate: data.candidate,
    });
  }

  // Actions

  async joinProjectRoom(authUser: AuthUser, project: LeanProjectDocument) {
    const room = this._getProjectRoom(project._id);
    await this._join(authUser.id, room);
    const activeUsers: EditorActiveUser[] = this._getActiveUsers(room);

    this._broadcast([room], 'project:user-joined', {
      userId: authUser.id,
      activeUsers,
    });
  }

  async leaveProjectRoom(authUser: AuthUser, project: LeanProjectDocument) {
    await this._leaveProjectRoom(getObjectIdAsString(project), authUser.id);
  }

  // ServerToClient Events

  async notificationCreated(notification: NotificationEntity) {
    const rooms = this._getUserRooms([getObjectIdAsString(notification.user)]);
    this._broadcast(rooms, 'notification:created', {
      notification: instanceToPlain(notification) as NotificationEntity,
    });
  }

  async notificationsUpdated(
    user: string,
    notifications: NotificationEntity[],
  ) {
    const rooms = this._getUserRooms([getObjectIdAsString(user)]);
    this._broadcast(rooms, 'notifications:updated', {
      notifications: notifications.map(
        (notification) => instanceToPlain(notification) as NotificationEntity,
      ),
    });
  }

  async notificationsRemoved(user: string, notificationIds: string[]) {
    const rooms = this._getUserRooms([user]);
    this._broadcast(rooms, 'notifications:removed', {
      notificationIds,
    });
  }

  async projectCreated(project: ProjectEntity) {
    const users = project.users.map((o) => getObjectIdAsString(o));
    const rooms = this._getUserRooms(users);
    this._broadcast(rooms, 'project:created', {
      project: instanceToPlain(project) as ProjectEntity,
    });
  }

  async projectUpdated(project: ProjectEntity) {
    const users = project.users.map((o) => getObjectIdAsString(o));
    const rooms = this._getUserRooms(users);
    this._broadcast(rooms, 'project:updated', {
      project: instanceToPlain(project) as ProjectEntity,
    });
  }

  async projectPartiallyUpdated(
    project: UpdatePartialProjectDto,
    fullProject: ProjectEntity,
  ) {
    const users = fullProject.users.map((o) => getObjectIdAsString(o));
    const rooms = this._getUserRooms(users);
    this._broadcast(rooms, 'project:partiallyUpdated', {
      project: instanceToPlain({
        ...project,
        id: fullProject._id.toString(),
      }) as Partial<ProjectEntity>,
    });
  }

  async projectRemoved(project: LeanProjectDocument) {
    const users = project.users.map((o) => getObjectIdAsString(o));
    const rooms = this._getUserRooms(users);
    this._broadcast(rooms, 'project:removed', {
      projectId: getObjectIdAsString(project._id),
    });
  }

  async projectMediaWaveformUpdated(project: ProjectEntity, values: number[]) {
    const users = project.users.map((o) => getObjectIdAsString(o));
    const rooms = this._getUserRooms(users);
    this._broadcast(rooms, 'project:media-waveform-updated', {
      projectId: getObjectIdAsString(project._id),
      values,
    });
  }

  async transcriptionCreated(
    project: LeanProjectDocument,
    transcription: TranscriptionEntity,
  ) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'transcription:created', {
      transcription: instanceToPlain(transcription) as TranscriptionEntity,
    });
  }

  async transcriptionUpdated(
    project: LeanProjectDocument,
    transcription: TranscriptionEntity,
  ) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'transcription:updated', {
      transcription: instanceToPlain(transcription) as TranscriptionEntity,
    });
  }

  async transcriptionRemoved(
    project: LeanProjectDocument,
    transcription: TranscriptionEntity,
  ) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'transcription:removed', {
      transcriptionId: getObjectIdAsString(transcription._id),
    });
  }

  async captionCreated(project: LeanProjectDocument, caption: CaptionEntity) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'caption:created', {
      caption: instanceToPlain(caption) as CaptionEntity,
    });
  }

  async captionUpdatedProjId(projectId: string, caption: CaptionEntity) {
    const room = this._getProjectRoom(projectId);
    this._broadcast([room], 'caption:updated', {
      caption: instanceToPlain(caption) as CaptionEntity,
    });
  }

  async captionUpdated(project: LeanProjectDocument, caption: CaptionEntity) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'caption:updated', {
      caption: instanceToPlain(caption) as CaptionEntity,
    });
  }

  async captionRemoved(project: LeanProjectDocument, caption: CaptionEntity) {
    const room = this._getProjectRoom(project._id);
    this._broadcast([room], 'caption:removed', {
      captionId: getObjectIdAsString(caption._id),
    });
  }

  // Kurento
  async serverIceCandidate(authUser: AuthUser, candidate: string) {
    const rooms = this._getUserRooms([authUser.id]);

    this._broadcast(rooms, 'livestream:server-ice-candidate', {
      candidate,
    });
  }

  // User-Test
  async userTestStart(projectId: string) {
    const room = this._getProjectRoom(projectId);
    this._broadcast([room], 'user-test:start', {
      projectId: getObjectIdAsString(projectId),
    });
  }

  async userTestUpdated(projectId: string, currentTime: number) {
    const room = this._getProjectRoom(projectId);
    this._broadcast([room], 'user-test:updated', {
      projectId: getObjectIdAsString(projectId),
      currentTime,
    });
  }

  async userTestStop(projectId: string) {
    const room = this._getProjectRoom(projectId);
    this._broadcast([room], 'user-test:stop', {
      projectId: getObjectIdAsString(projectId),
    });
  }
}
