import { Socket } from 'socket.io-client';
import { EditorUserColor } from 'src/app/constants/editor.constants';
import { NotificationEntity } from '../api/entities/notification.entity';

export interface ClientToServerEvents {
  'livestream:client-ice-candidate': (payload: {
    candidate: string;
    projectId: string;
  }) => void;
}

export interface ServerToClientEvents {
  'connection:invalid-credentials': (payload: {
    message: 'Invalid credentials';
  }) => void;
  'project:user-joined': (payload: {
    userId: string;
    activeUsers: { id: string; color: EditorUserColor }[];
  }) => void;
  'project:user-left': (payload: {
    userId: string;
    activeUsers: { id: string; color: EditorUserColor }[];
  }) => void;
  'project:created': (payload: { project: any }) => void;
  'project:updated': (payload: { project: any }) => void;
  'project:partiallyUpdated': (payload: { project: any }) => void;
  'project:removed': (payload: { projectId: string }) => void;
  'project:media-waveform-updated': (payload: {
    projectId: string;
    values: number[];
  }) => void;
  'transcription:created': (payload: { transcription: any }) => void;
  'transcription:updated': (payload: { transcription: any }) => void;
  'transcription:removed': (payload: { transcriptionId: string }) => void;
  'caption:created': (payload: { caption: any }) => void;
  'caption:updated': (payload: { caption: any }) => void;
  'caption:removed': (payload: { captionId: string }) => void;
  'notification:created': (payload: { notification: any }) => void;
  'notifications:updated': (payload: {
    notifications: NotificationEntity[];
  }) => void;
  'notifications:removed': (payload: { notificationIds: string[] }) => void;

  // Livestream
  'livestream:server-ice-candidate': (payload: { candidate: string }) => void;

  // User-Test
  'user-test:start': (payload: { projectId: string }) => void;
  'user-test:updated': (payload: {
    projectId: string;
    currentTime: number;
  }) => void;
  'user-test:stop': (payload: { projectId: string }) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
