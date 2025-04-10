import { CaptionEntity } from '../caption/entities/caption.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { ProjectEntity } from '../project/entities/project.entity';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';

export interface ClientToServerEvents {
  'connection:auth': (payload: { token: string }) => void;
  //'livestream:client-ice-candidate': (payload: { candidate: string }) => void;
}

interface EditorUser {
  userId: string;
  clientId: string;
  active: boolean;
  color: number;
}

export interface ServerToClientEvents {
  // Connection
  'connection:connected': () => void;
  'connection:authorized': () => void;
  'connection:invalid-credentials': () => void;
  'connection:already-authorised': () => void;
  'connection:unauthorized': () => void;
  'unknown-event': () => void;

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
  'project:user-changed': (payload: { users: EditorUser[] }) => void;
  // 'project:user-joined': (payload: {
  //   userId: string; // remove
  //   clientId: string; // remov
  //   activeUsers: EditorUser[];
  // }) => void;
  // 'project:user-left': (payload: {
  //   userId: string;
  //   clientId: string;
  //   activeUsers: {
  //     userId: string;
  //     clientId: string;
  //     active: boolean;
  //     color: EditorUserColor;
  //   }[];
  // }) => void;
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
  // 'livestream:server-ice-candidate': (payload: { candidate: string }) => void;
}

export interface ServerSideEvents {}

export interface EventsMap {
  [event: string]: any;
}

export declare type EventNames<Map extends EventsMap> = keyof Map &
  (string | symbol);

export declare type EventParams<
  Map extends EventsMap,
  Ev extends EventNames<Map>,
> = Parameters<Map[Ev]>[0];
