import { Req } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import {
  AVAILABLE_EDITOR_USER_COLORS,
  EditorActiveUser,
  EditorUserColor,
} from '../../constants/editor.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanProjectDocument } from '../../modules/db/schemas/project.schema';
import { TiptapService } from '../../modules/tiptap/tiptap.service';
import { getObjectIdAsString } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { UpdatePartialProjectDto } from '../project/dto/update-partial-project.dto';
import { ProjectEntity } from '../project/entities/project.entity';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private socketService: SocketService,
    private db: DbService,
    private tiptapService: TiptapService,
  ) {}

  afterInit(server: Server) {
    this.socketService.init(server);
  }

  handleConnection(client: WebSocket, @Req() req: IncomingMessage) {
    if (req.url.includes('hocuspocus')) {
      this.tiptapService.handleConnection(client, req, null);
    } else {
      this.socketService.handleConnection(client);
    }
  }

  async handleDisconnect(client: WebSocket) {
    if (this.socketService.isClientAuthorised(client)) {
      const rooms = this.socketService.getClientRooms(client);
      const projectIds = rooms
        .filter((o) => o.startsWith('project:'))
        .map((o) => o.replace('project:', ''));
      const projects = (await this.db.projectModel
        .find({ id: { $in: projectIds } })
        .lean()
        .exec()) as LeanProjectDocument[];

      this.socketService.handleDisconnect(client);

      // Handle disconnect first
      for (const project of projects) {
        const room = `project:${project._id.toString()}`;
        this.socketService.broadcast(room, 'project:user-changed', {
          users: this._getUsers(room, project),
        });
      }

      // Unlock captions
    } else {
      this.socketService.handleDisconnect(client);
    }
  }

  _getUserColor(userId: string, project: LeanProjectDocument) {
    const index = project.users.findIndex((o) => o._id.toString() === userId);

    return AVAILABLE_EDITOR_USER_COLORS[
      index % AVAILABLE_EDITOR_USER_COLORS.length
    ] as EditorUserColor;
  }

  _getUsers(room: string, project: LeanProjectDocument): EditorActiveUser[] {
    const clients = this.socketService.getRoomClients(room);

    const activeUsers: EditorActiveUser[] = clients
      ? clients.map((client) => ({
          userId: client.data.userId,
          clientId: client.data.clientId,
          active: true,
          color: this._getUserColor(client.data.userId, project),
        }))
      : [];

    const otherUsers: EditorActiveUser[] = project.users
      .filter(
        (user) =>
          !activeUsers.some(
            (activeUser) => activeUser.userId === user._id.toString(),
          ),
      )
      .map((o) => ({
        userId: o._id.toString(),
        clientId: null,
        active: false,
        color: this._getUserColor(o._id.toString(), project),
      }));
    const combined = [...activeUsers, ...otherUsers];
    return combined;
  }

  async joinProjectRoom(authUser: AuthUser, project: LeanProjectDocument) {
    const room = `project:${project._id.toString()}`;
    const socket = this.socketService.getSocket(authUser.id, authUser.jwtId);
    this.socketService.join(room, socket);

    this.socketService.broadcast(room, 'project:user-changed', {
      users: this._getUsers(room, project),
    });

    // this.socketService.broadcast(room, 'project:user-joined', {
    //   userId: authUser.id,
    //   clientId: socket.data.clientId,
    //   activeUsers: this._getActiveUsers(room, project),
    // });
  }

  async leaveProjectRoom(authUser: AuthUser, project: LeanProjectDocument) {
    const room = `project:${project._id.toString()}`;
    const socket = this.socketService.getSocket(authUser.id, authUser.jwtId);
    this.socketService.leave(room, socket);

    this.socketService.broadcast(room, 'project:user-changed', {
      users: this._getUsers(room, project),
    });

    // this.socketService.broadcast(room, 'project:user-left', {
    //   userId: authUser.id,
    //   clientId: socket.data.clientId,
    //   activeUsers: this._getActiveUsers(room, project),
    // });
  }

  async notificationCreated(notification: NotificationEntity) {
    this.socketService.broadcast(
      `user:${notification.user.toString()}`,
      'notification:created',
      {
        notification: instanceToPlain(notification) as NotificationEntity,
      },
    );
  }

  async notificationsUpdated(
    user: string,
    notifications: NotificationEntity[],
  ) {
    this.socketService.broadcast(
      `user:${user.toString()}`,
      'notifications:updated',
      {
        notifications: notifications.map(
          (notification) => instanceToPlain(notification) as NotificationEntity,
        ),
      },
    );
  }

  async notificationsRemoved(user: string, notificationIds: string[]) {
    this.socketService.broadcast(
      `user:${user.toString()}`,
      'notifications:removed',
      {
        notificationIds,
      },
    );
  }

  async projectCreated(project: ProjectEntity) {
    const rooms = project.users.map((o) => `user:${o._id.toString()}`);
    const payload = {
      project: instanceToPlain(project) as ProjectEntity,
    };
    for (const room of rooms) {
      this.socketService.broadcast(room, 'project:created', payload);
    }
  }

  async projectUpdated(
    project: ProjectEntity,
    notifyRemovedUsers: string[] = [],
  ) {
    const users = [
      ...project.users.map((o) => getObjectIdAsString(o)),
      ...notifyRemovedUsers,
    ];
    const rooms = users.map((o) => `user:${o.toString()}`);
    const payload = {
      project: instanceToPlain(project) as ProjectEntity,
    };
    for (const room of rooms) {
      this.socketService.broadcast(room, 'project:updated', payload);
    }
  }

  async projectPartiallyUpdated(
    project: ProjectEntity,
    updateDto: UpdatePartialProjectDto,
  ) {
    const rooms = project.users.map((o) => `user:${o._id.toString()}`);
    const payload = {
      project: {
        id: project._id.toString(),
        ...(instanceToPlain(updateDto) as Partial<ProjectEntity>),
      },
    };
    for (const room of rooms) {
      this.socketService.broadcast(room, 'project:partiallyUpdated', payload);
    }
  }

  async projectRemoved(project: LeanProjectDocument) {
    const rooms = project.users.map((o) => `user:${o._id.toString()}`);
    const payload = {
      projectId: project._id.toString(),
    };
    for (const room of rooms) {
      this.socketService.broadcast(room, 'project:removed', payload);
    }
  }

  // TODO: Is this event necessary? Can we just use the project room?
  async projectMediaWaveformUpdated(project: ProjectEntity, values: number[]) {
    const rooms = project.users.map((o) => `user:${o._id.toString()}`);
    const payload = { projectId: project._id.toString(), values };
    for (const room of rooms) {
      this.socketService.broadcast(
        room,
        'project:media-waveform-updated',
        payload,
      );
    }
  }

  async transcriptionCreated(
    project: ProjectEntity,
    transcription: TranscriptionEntity,
  ) {
    this.socketService.broadcast(
      `project:${project._id.toString()}`,
      'transcription:created',
      {
        transcription: instanceToPlain(transcription) as TranscriptionEntity,
      },
    );
  }

  async transcriptionUpdated(
    project: ProjectEntity,
    transcription: TranscriptionEntity,
  ) {
    this.socketService.broadcast(
      `project:${project._id.toString()}`,
      'transcription:updated',
      {
        transcription: instanceToPlain(transcription) as TranscriptionEntity,
      },
    );
  }

  async transcriptionRemoved(
    project: ProjectEntity,
    transcription: TranscriptionEntity,
  ) {
    this.socketService.broadcast(
      `project:${project._id.toString()}`,
      'transcription:removed',
      {
        transcriptionId: getObjectIdAsString(transcription._id),
      },
    );
  }
}
