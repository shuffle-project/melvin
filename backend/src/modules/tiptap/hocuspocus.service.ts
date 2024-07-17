import { Database } from '@hocuspocus/extension-database';
import { Hocuspocus } from '@hocuspocus/server';
import { DirectConnection } from '@hocuspocus/server/dist/packages/server/src/DirectConnection';
import { Injectable } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import { DbService } from '../db/db.service';
import { CustomLogger } from '../logger/logger.service';
@Injectable()
export class HocuspocusService {
  private server = new Hocuspocus({
    extensions: [
      new Database({
        fetch: async ({ documentName }) => {
          const transcription = await this.db.transcriptionModel
            .findById(documentName)
            .exec();

          return transcription.ydoc;
        },
        store: async ({ documentName, state }) => {
          await this.db.transcriptionModel.findByIdAndUpdate(documentName, {
            $set: { ydoc: state },
          });
        },
      }),
    ],
  });

  constructor(private db: DbService, private logger: CustomLogger) {
    this.logger.setContext(this.constructor.name);
  }

  public handleConnection(
    websocket: WebSocket,
    request: IncomingMessage,
    context: any,
  ) {
    this.logger.log('handle connection');
    this.server.handleConnection(websocket, request, context);
  }

  public async openDirectConnection(
    transcriptionId: string,
  ): Promise<DirectConnection> {
    return this.server.openDirectConnection(transcriptionId);
  }
}
