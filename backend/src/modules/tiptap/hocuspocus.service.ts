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
        store: async ({ documentName, state, document }) => {
          // TODO transform state to JSON to backup data
          // console.log(documentName, state);

          // const ydoc = new Document('default');
          // // const ydoc = new Y.Doc();

          // ydoc.on('updateV2', (update, origin) => {
          //   console.log('update', update, origin);
          // });

          // const stateAsUint8Array = new Uint8Array(state.buffer);

          // const stateVector = Y.encodeStateAsUpdateV2(ydoc, stateAsUint8Array);

          // Y.applyUpdateV2(ydoc, stateVector);
          // // const ydoc2 = TiptapTransformer.toYdoc(state);

          // const fromYdoc = TiptapTransformer.fromYdoc(ydoc, 'default');

          // console.log(fromYdoc);

          // const jsonData = ydoc.getMap('content').toJSON();
          // console.log(jsonData);

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
    this.logger.verbose('handle connection');
    this.server.handleConnection(websocket, request, context);
  }

  public async openDirectConnection(
    transcriptionId: string,
  ): Promise<DirectConnection> {
    return this.server.openDirectConnection(transcriptionId);
  }
}
