import { ShortTranscriptionEntity } from './transcription.entity';
import { UserEntity } from './user.entity';

export enum MediaType {
  VIEDEO = 'video',
}

export interface AdditionalMedia {
  id: string;
  title: string;
  mediaType: MediaType;
}

export interface AdditionalVideo {
  id: string;
  url: string;
  title: string;
}

export interface MediaLinksEntity {
  video: string;
  audio: string;
  additionalVideos: AdditionalVideo[];
}

export enum LivestreamStatus {
  NOT_CONNECTED = 'not_connected',
  STARTED = 'started',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export enum RecordingStatus {
  NOT_STARTED = 'not_started',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export enum RecordingTimestampType {
  START = 'start',
  STOP = 'stop',
}

export interface LivestreamEntity {
  url?: string;
  mediaPipelineId: string | null;
  livestreamStatus: LivestreamStatus;
  recordingStatus: RecordingStatus;
  recordingTimestamps: { type: RecordingTimestampType; timestamp: string };
}

export interface ProjectEntity {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  duration: number;
  status: ProjectStatus;
  start: number;
  end: number;
  language: string;
  exports: string[];
  // transcriptions: string[];
  transcriptions: ShortTranscriptionEntity[];
  // users: string[];
  users: UserEntity[];
  media?: MediaLinksEntity;
  additionalMedia: AdditionalMedia[];
  livestream?: LivestreamEntity;
}

export enum ProjectStatus {
  FINISHED = 'finished',
  LIVE = 'live',
  WAITING = 'waiting',
  DRAFT = 'draft',
  PROCESSING = 'processing',
  ERROR = 'error',
}
