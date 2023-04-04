import { Server, Socket } from 'socket.io';
import { EditorUserColor } from 'src/constants/editor.constants';
import { CaptionEntity } from '../caption/entities/caption.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { ProjectEntity } from '../project/entities/project.entity';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';

export interface ClientToServerEvents {
  'livestream:client-ice-candidate': (payload: { candidate: string }) => void;
}

export interface ServerToClientEvents {
  // Connection
  'connection:invalid-credentials': (payload: {
    message: 'Invalid credentials';
  }) => void;

  // Notifications
  'notification:created': (payload: {
    notification: NotificationEntity;
  }) => void;
  'notifications:updated': (payload: {
    notifications: NotificationEntity[];
  }) => void;
  'notifications:removed': (payload: { notificationIds: string[] }) => void;
  // 'notification:many-removed': (payload: { notificationIds: string[] }) => void;

  // Project
  'project:user-joined': (payload: {
    userId: string;
    activeUsers: { id: string; color: string }[];
  }) => void;
  'project:user-left': (payload: {
    userId: string;
    activeUsers: { id: string; color: string }[];
  }) => void;
  'project:created': (payload: { project: ProjectEntity }) => void;
  'project:updated': (payload: { project: ProjectEntity }) => void;
  'project:partiallyUpdated': (payload: {
    project: Partial<ProjectEntity>;
  }) => void;
  'project:removed': (payload: { projectId: string }) => void;
  'project:media-waveform-updated': (payload: {
    projectId: string;
    values: number[];
  }) => void;

  // Transcription
  'transcription:created': (payload: {
    transcription: TranscriptionEntity;
  }) => void;
  'transcription:updated': (payload: {
    transcription: TranscriptionEntity;
  }) => void;
  'transcription:removed': (payload: { transcriptionId: string }) => void;

  // Caption
  'caption:created': (payload: { caption: CaptionEntity }) => void;
  'caption:updated': (payload: { caption: CaptionEntity }) => void;
  'caption:removed': (payload: { captionId: string }) => void;

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

export interface ServerSideEvents {}

export interface SocketData {
  userId: string;
  userColor: EditorUserColor;
}

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  ServerSideEvents,
  SocketData
>;

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  ServerSideEvents,
  SocketData
>;
