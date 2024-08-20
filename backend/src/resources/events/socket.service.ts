import { Injectable } from '@nestjs/common';
import { RawData, Server, WebSocket } from 'ws';
import { CustomLogger } from '../../modules/logger/logger.service';
import { DecodedToken } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import {
  ClientToServerEvents,
  EventNames,
  EventParams,
  ServerToClientEvents,
} from './events.interfaces';

export interface AuthorizedWebSocket extends WebSocket {
  data?: {
    isAuthorised: boolean;
    userId: string;
  };
}

@Injectable()
export class SocketService {
  private server: Server;

  private clients: Set<AuthorizedWebSocket> = new Set();

  private users: Map<string, AuthorizedWebSocket> = new Map();
  private rooms: Map<string, AuthorizedWebSocket[]> = new Map();

  constructor(private logger: CustomLogger, private authService: AuthService) {
    this.logger.setContext(this.constructor.name);
  }

  init(server: Server) {
    this.server = server;
  }

  handleConnection(client: WebSocket) {
    this.clients.add(client);
    this.send(client, 'connection:connected');
    client.on('message', (data: RawData) => this.onMessage(client, data));
  }

  handleDisconnect(client: AuthorizedWebSocket) {
    this.clients.delete(client);
    if (this.isClientAuthorised(client)) {
      const rooms = this.getClientRooms(client);
      rooms.map((room) => this.leave(room, client.data.userId));
      this.users.delete(client.data.userId);
    }
  }

  isClientAuthorised(client: WebSocket | AuthorizedWebSocket) {
    return (client as any).data?.isAuthorised;
  }

  private parseMessage<Ev extends EventNames<ClientToServerEvents>>(
    data: RawData,
  ): { event: Ev; payload: EventParams<ClientToServerEvents, Ev> } {
    try {
      const { event, payload } = JSON.parse(data.toString());
      return { event, payload };
    } catch (err) {
      throw new Error('invalid_message');
    }
  }

  onMessage(client: WebSocket, data: RawData) {
    try {
      const { event, payload } = this.parseMessage(data);
      this.logger.verbose('received', {
        event,
        ...(event === 'connection:auth' ? { token: '******' } : payload),
      });

      if (event === 'connection:auth') {
        if (this.isClientAuthorised(client)) {
          this.send(client, 'connection:already-authorised');
          return;
        }

        try {
          const dtoken: DecodedToken = this.authService.verifyToken(
            payload.token,
          );
          const userId = dtoken.id;
          (client as AuthorizedWebSocket).data = {
            isAuthorised: true,
            userId,
          };
          this.users.set(userId, client as AuthorizedWebSocket);
          this.send(client, 'connection:authorized');
          this.join(`user:${userId}`, userId);
          return;
        } catch (err) {
          this.logger.warn(err.message, err);
          this.send(client, 'connection:invalid-credentials');
          client.close();
          return;
        }
      }

      if (!this.isClientAuthorised(client)) {
        this.send(client, 'connection:unauthorized');
        client.close();
        return;
      }

      switch (event) {
        default:
          this.logger.warn('unknown-event', event);
          this.send(client, 'unknown-event');
      }
    } catch (err) {
      this.logger.error(err.message, err);
    }
  }

  join(roomName: string, userId: string) {
    const socket = this.users.get(userId);

    if (!socket) {
      throw new Error('user_socket_not_found');
    }

    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, []);
    }
    const room = this.rooms.get(roomName);
    room.push(socket);
  }

  leave(roomName: string, userId: string) {
    const socket = this.users.get(userId);

    if (!socket) {
      throw new Error('user_socket_not_found');
    }

    const room = this.rooms.get(roomName);

    if (!room) {
      throw new Error('room_not_found');
    }

    const updatedRoom = room.filter((o) => o !== socket);

    if (updatedRoom.length === 0) {
      this.rooms.delete(roomName);
    } else {
      this.rooms.set(roomName, updatedRoom);
    }
  }

  getRoomClients(roomName: string): AuthorizedWebSocket[] {
    return this.rooms.get(roomName);
  }

  getClientRooms(socket: AuthorizedWebSocket): string[] {
    return [...this.rooms.entries()]
      .filter((o) => o[1].includes(socket))
      .map((o) => o[0]);
  }

  send<Ev extends EventNames<ServerToClientEvents>>(
    client: WebSocket,
    event: Ev,
    payload?: EventParams<ServerToClientEvents, Ev>,
  ) {
    client.send(JSON.stringify({ event, payload }));
  }

  broadcast<Ev extends EventNames<ServerToClientEvents>>(
    roomName: string,
    event: Ev,
    payload?: EventParams<ServerToClientEvents, Ev>,
  ) {
    const sockets = this.rooms.get(roomName);
    if (sockets) {
      const message = JSON.stringify({ event, payload });
      sockets.map((o) => o.send(message));
    }
  }
}
