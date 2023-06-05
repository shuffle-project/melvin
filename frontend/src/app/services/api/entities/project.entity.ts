import { ShortTranscriptionEntity } from './transcription.entity';
import { UserEntity } from './user.entity';

export interface MediaLinksEntity {
  video: string;
  additionalVideos: string[];
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
