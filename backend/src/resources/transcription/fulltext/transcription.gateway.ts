// websocket connection, calls services
import { Req } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { CustomLogger } from '../../../modules/logger/logger.service';
import { HocuspocusService } from './hocuspocus.service';

// TODO AuthGuards
@WebSocketGateway(3001, {
  transports: ['websocket'],
})
export class TranscriptionGateway implements OnGatewayConnection {
  constructor(
    private hocuspocusService: HocuspocusService,
    private logger: CustomLogger,
  ) {}

  handleConnection(client: WebSocket, @Req() request: any) {
    this.logger.verbose('handleConnection');
    this.hocuspocusService.handleConnection(client, request, null);
  }
}
