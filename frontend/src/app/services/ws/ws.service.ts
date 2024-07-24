import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subject } from 'rxjs';
import { io } from 'socket.io-client';
import * as projectActions from 'src/app/store/actions/projects.actions';
import { environment } from '../../../environments/environment';
import { CustomLogger } from '../../classes/logger.class';
import * as authActions from '../../store/actions/auth.actions';
import * as captionsActions from '../../store/actions/captions.actions';
import * as editorActions from '../../store/actions/editor.actions';
import * as notificationsActions from '../../store/actions/notifications.actions';
import * as transcriptionsActions from '../../store/actions/transcriptions.actions';
import * as userTestActions from '../../store/actions/user-test.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import { TypedSocket } from './ws.interfaces';

@Injectable({
  providedIn: 'root',
})
export class WSService {
  public onServerIceCandidate$ = new Subject<{
    candidate: string;
  }>();

  private socket!: TypedSocket;

  private logger = new CustomLogger('WS SERVICE');

  constructor(private store: Store) {
    this.createSocket();

    this.logger.disable();
  }

  private createSocket() {
    const [scheme, basename] = environment.baseRestApi.split('://');
    const protocol = scheme === 'https' ? 'wss' : 'ws';
    const [hostname, ...elements] = basename.split('/');

    const path = `/${[...elements, 'socket.io'].join('/')}/`;
    const url = `${protocol}://${hostname}`;

    this.socket = io(url, {
      autoConnect: false,
      path,
    });

    this.registerEvents();
  }

  async connect() {
    this.logger.verbose('connect()');

    // Set authentication token
    const token = await firstValueFrom(
      this.store.select(authSelectors.selectToken)
    );
    this.socket.auth = { token };

    // Connect
    this.socket.connect();
    // this.socket.on('error', (err: any) => console.log(err));

    this.socket.on('connection:invalid-credentials', (data) =>
      this.logger.verbose(`on('connection:invalid-credentials')`, data)
    );

    this.socket.on('connect', () => {
      this.logger.verbose(`on('connect')`, {
        connected: this.socket.connected,
        disconnected: this.socket.disconnected,
      });
      this.store.dispatch(authActions.userConnectedToWebsocket());
    });

    this.socket.io.on('error', (error) => {
      this.logger.error(`on('error')`, { error });
    });
  }

  async disconnect() {
    this.logger.verbose('disconnect()');
    this.socket.disconnect();
  }

  registerEvents() {
    // Project events
    this.socket.on('project:created', (data) => {
      this.logger.verbose('project:created', data);
      this.store.dispatch(
        projectActions.createFromWS({ createdProject: data.project })
      );
    });

    this.socket.on('project:updated', async (data) => {
      const authUserId = await firstValueFrom(
        this.store.select(authSelectors.selectUserId)
      );
      this.logger.verbose('project:updated', data);
      this.store.dispatch(
        projectActions.updateFromWS({
          updatedProject: data.project,
          authUserId: authUserId!,
        })
      );
    });

    this.socket.on('project:partiallyUpdated', (data) => {
      this.logger.verbose('project:partiallyUpdated', data);
      this.store.dispatch(
        projectActions.updateFromWSPartial({ updatedProject: data.project })
      );
    });

    this.socket.on('project:removed', (data) => {
      this.logger.verbose('project:removed', data);
      this.store.dispatch(
        projectActions.removeFromWS({ removedProjectId: data.projectId })
      );
    });

    this.socket.on('project:media-waveform-updated', (data) => {
      this.logger.verbose('project:media-waveform-updated', data);
      this.store.dispatch(editorActions.updateWaveformFromWS(data));
    });

    this.socket.on('project:user-joined', (data) => {
      this.logger.verbose('project:user-joined', data);
      this.store.dispatch(
        editorActions.updateActiveUsers({ activeUsers: data.activeUsers })
      );
    });

    this.socket.on('project:user-left', (data) => {
      this.logger.verbose('project:user-left', data);
      this.store.dispatch(
        editorActions.updateActiveUsers({ activeUsers: data.activeUsers })
      );
    });

    // Transcription events
    this.socket.on('transcription:created', (data) => {
      this.logger.verbose('transcription:created', data);
      this.store.dispatch(
        transcriptionsActions.createFromWS({
          transcription: data.transcription,
        })
      );
    });

    this.socket.on('transcription:updated', (data) => {
      this.logger.verbose('transcription:updated', data);
      this.store.dispatch(
        transcriptionsActions.updateFromWS({
          updatedTranscription: data.transcription,
        })
      );
    });

    this.socket.on('transcription:removed', (data) => {
      this.logger.verbose('transcription:removed', data);
      this.store.dispatch(
        transcriptionsActions.removeFromWS({
          removedTranscriptionId: data.transcriptionId,
        })
      );
    });

    // Caption events
    this.socket.on('caption:created', (data) => {
      this.logger.verbose('caption:created', data);
      this.store.dispatch(
        captionsActions.createFromWS({ newCaption: data.caption })
      );
    });

    this.socket.on('caption:updated', (data) => {
      this.logger.verbose('caption:updated', data);
      this.store.dispatch(
        captionsActions.updateFromWS({ updateCaption: data.caption })
      );
    });

    this.socket.on('caption:removed', (data) => {
      this.logger.verbose('caption:removed', data);
      this.store.dispatch(
        captionsActions.removeFromWS({ removeCaptionId: data.captionId })
      );
    });

    // Notification Events
    this.socket.on('notification:created', (data) => {
      this.logger.verbose('notification: created', data);
      this.store.dispatch(
        notificationsActions.createFromWS({ notification: data.notification })
      );
    });

    this.socket.on('notifications:updated', (data) => {
      this.logger.verbose('notifications:updated', data);
      this.store.dispatch(
        notificationsActions.updateFromWS({ notifications: data.notifications })
      );
    });

    this.socket.on('notifications:removed', (data) => {
      this.logger.verbose('notifications:removed', data);
      this.store.dispatch(
        notificationsActions.removeFromWS({
          removedNotificationIds: data.notificationIds,
        })
      );
    });

    // Livestream
    this.socket.on('livestream:server-ice-candidate', (data) => {
      this.logger.verbose('livestream:server-ice-candidate', data);
      this.onServerIceCandidate$.next({ candidate: data.candidate });
    });
  }

  clientIceCandidate(candidate: string, projectId: string) {
    this.socket.emit('livestream:client-ice-candidate', {
      candidate,
      projectId,
    });
    // User-Test
    this.socket.on('user-test:start', (data) => {
      this.logger.verbose('user-test:start', data);
      this.store.dispatch(
        userTestActions.playFromWS({
          projectId: data.projectId,
        })
      );
    });

    this.socket.on('user-test:updated', (data) => {
      this.logger.verbose('user-test:updated', data);
      this.store.dispatch(
        userTestActions.updateCurrentTimeFromWS({
          projectId: data.projectId,
          currentTime: data.currentTime,
        })
      );
    });

    this.socket.on('user-test:stop', (data) => {
      this.logger.verbose('user-test:stop', data);
      this.store.dispatch(
        userTestActions.stopFromWS({
          projectId: data.projectId,
        })
      );
    });
  }
}
