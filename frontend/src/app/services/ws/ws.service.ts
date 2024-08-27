import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, retry, Subject, takeUntil } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { CustomLogger } from '../../classes/logger.class';
import * as authActions from '../../store/actions/auth.actions';
import * as captionActions from '../../store/actions/captions.actions';
import * as editorActions from '../../store/actions/editor.actions';
import * as notificationActions from '../../store/actions/notifications.actions';
import * as projectActions from '../../store/actions/projects.actions';
import * as transcriptionActions from '../../store/actions/transcriptions.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import {
  ClientToServerEvents,
  EventNames,
  EventParams,
  ServerToClientEvents,
} from './ws.interfaces';
@Injectable({
  providedIn: 'root',
})
export class WSService {
  public onServerIceCandidate$ = new Subject<{
    candidate: string;
  }>();

  private socket!: WebSocketSubject<any>;
  private disconnected$ = new Subject<void>();

  private logger = new CustomLogger('WS SERVICE');

  constructor(private store: Store) {
    this.createSocket();
  }

  public getWebSocketURL(): string {
    const [scheme, basename] = environment.baseRestApi.split('://');
    const protocol = scheme === 'https' ? 'wss' : 'ws';
    const [hostname, ...elements] = basename.split('/');
    return `${protocol}://${hostname}`;
  }

  private createSocket() {
    this.socket = webSocket({
      url: this.getWebSocketURL(),
    });
  }

  async connect() {
    this.logger.verbose('connect()');

    // TODO: Check if reconnect works after one disconnect from the server and one from the client
    this.socket
      .pipe(
        takeUntil(this.disconnected$),
        retry({
          delay: 3000,
        })
      )
      .subscribe({
        next: (message: any) => this.onMessage(message.event, message.payload),
        error: (err: Error) => this.logger.error(err.message, err),
        complete: () => this.logger.info('complete'),
      });
  }

  async disconnect() {
    this.logger.verbose('disconnect()');
    this.disconnected$.next();
    this.socket.complete();
  }

  emit<Ev extends EventNames<ClientToServerEvents>>(
    event: Ev,
    payload: EventParams<ClientToServerEvents, Ev>
  ) {
    this.socket.next({ event, payload });
  }

  async onMessage<Ev extends EventNames<ServerToClientEvents>>(
    event: Ev,
    args: EventParams<ServerToClientEvents, Ev>
  ) {
    try {
      switch (event) {
        case 'connection:connected': {
          const token = await firstValueFrom(
            this.store.select(authSelectors.selectToken)
          );
          this.emit('connection:auth', { token: token! });
          break;
        }
        case 'connection:authorized': {
          this.store.dispatch(authActions.userConnectedToWebsocket());
          break;
        }
        case 'connection:already-authorised': {
          this.logger.warn('connection:already-authorised');
          break;
        }
        case 'connection:invalid-credentials': {
          this.logger.error('connection:invalid-credentials');
          break;
        }
        case 'connection:unauthorized': {
          this.logger.error('connection:unauthorized');
          break;
        }
        case 'project:user-joined': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:user-joined'
          >;
          this.logger.verbose('project:user-joined', payload);
          this.store.dispatch(
            editorActions.updateActiveUsers({
              activeUsers: payload.activeUsers,
            })
          );
          break;
        }
        case 'project:user-left': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:user-left'
          >;
          this.logger.verbose('project:user-left', payload);
          this.store.dispatch(
            editorActions.updateActiveUsers({
              activeUsers: payload.activeUsers,
            })
          );
          break;
        }
        case 'project:created': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:created'
          >;
          this.logger.verbose('project:created', payload);
          this.store.dispatch(
            projectActions.createFromWS({ createdProject: payload.project })
          );
          break;
        }
        case 'project:updated': {
          const authUserId = await firstValueFrom(
            this.store.select(authSelectors.selectUserId)
          );

          const payload = args as EventParams<
            ServerToClientEvents,
            'project:updated'
          >;
          this.logger.verbose('project:updated', payload);
          this.store.dispatch(
            projectActions.updateFromWS({
              updatedProject: payload.project,
              authUserId: authUserId!,
            })
          );
          break;
        }
        case 'project:partiallyUpdated': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:partiallyUpdated'
          >;
          this.logger.verbose('project:partiallyUpdated', payload);
          this.store.dispatch(
            projectActions.updateFromWSPartial({
              updatedProject: payload.project,
            })
          );
          break;
        }
        case 'project:removed': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:removed'
          >;
          this.logger.verbose('project:removed', payload);
          this.store.dispatch(
            projectActions.removeFromWS({ removedProjectId: payload.projectId })
          );
          break;
        }
        case 'project:media-waveform-updated': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'project:media-waveform-updated'
          >;
          this.logger.verbose('project:media-waveform-updated', payload);
          this.store.dispatch(editorActions.updateWaveformFromWS(payload));
          break;
        }
        case 'transcription:created': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'transcription:created'
          >;
          this.logger.verbose('transcription:created', payload);
          this.store.dispatch(
            transcriptionActions.createFromWS({
              transcription: payload.transcription,
            })
          );
          break;
        }
        case 'transcription:updated': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'transcription:updated'
          >;
          this.logger.verbose('transcription:updated', payload);
          this.store.dispatch(
            transcriptionActions.updateFromWS({
              updatedTranscription: payload.transcription,
            })
          );
          break;
        }
        case 'transcription:removed': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'transcription:removed'
          >;
          this.logger.verbose('transcription:removed', payload);
          this.store.dispatch(
            transcriptionActions.removeFromWS({
              removedTranscriptionId: payload.transcriptionId,
            })
          );
          break;
        }
        case 'caption:created': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'caption:created'
          >;
          this.logger.verbose('caption:created', payload);
          this.store.dispatch(
            captionActions.createFromWS({ newCaption: payload.caption })
          );
          break;
        }
        case 'caption:updated': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'caption:updated'
          >;
          this.logger.verbose('caption:updated', payload);
          this.store.dispatch(
            captionActions.updateFromWS({ updateCaption: payload.caption })
          );
          break;
        }
        case 'caption:removed': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'caption:removed'
          >;
          this.logger.verbose('caption:removed', payload);
          this.store.dispatch(
            captionActions.removeFromWS({ removeCaptionId: payload.captionId })
          );
          break;
        }
        case 'notification:created': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'notification:created'
          >;
          this.logger.verbose('notification:created', payload);
          this.store.dispatch(
            notificationActions.createFromWS({
              notification: payload.notification,
            })
          );
          break;
        }
        case 'notifications:updated': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'notifications:updated'
          >;
          this.logger.verbose('notifications:updated', payload);
          this.store.dispatch(
            notificationActions.updateFromWS({
              notifications: payload.notifications,
            })
          );
          break;
        }
        case 'notifications:removed': {
          const payload = args as EventParams<
            ServerToClientEvents,
            'notifications:removed'
          >;
          this.logger.verbose('notifications:removed', payload);
          this.store.dispatch(
            notificationActions.removeFromWS({
              removedNotificationIds: payload.notificationIds,
            })
          );
          break;
        }
      }
    } catch (err: any) {
      this.logger.error(err.message, err);
    }
  }
}
