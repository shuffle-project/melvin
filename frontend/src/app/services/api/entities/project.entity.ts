import { ShortTranscriptionEntity } from './transcription.entity';
import { UserEntity } from './user.entity';

export enum MediaType {
  VIEDEO = 'video',
}
export enum MediaStatus {
  FINISHED = 'finished',
  WAITING = 'waiting',
  PROCESSING = 'processing',
  ERROR = 'error',
}

export enum MediaCategory {
  MAIN = 'main',
  OTHER = 'other',
  SIGN_LANGUAGE = 'sign_language',
  SLIDES = 'slides',
  SPEAKER = 'speaker',
}

export interface AdditionalMedia {
  id: string;
  title: string;
  mediaType: MediaType;
}

export interface MediaEntity {
  id: string;
  updatedAt: string;
  createdAt: string;
  status: MediaStatus;
  title: string;
  originalFileName: string;
  category: MediaCategory;
  extension: string;
  url: string;
  mimetype: string;
}

export interface VideoEntity extends MediaEntity {}

export interface AudioEntity extends MediaEntity {}

export interface VideoLinkEntity {
  id: string;
  url: string;
  title: string;
  originalFileName: string;
  status: MediaStatus;
  category: MediaCategory;
}

export interface MediaLinksEntity {
  video: string;
  audio: string;
  videos: VideoLinkEntity[];
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
  // media?: MediaLinksEntity;
  // additionalMedia: AdditionalMedia[];
  livestream?: LivestreamEntity;
  // audios: AudioEntity[];
  // videos: VideoEntity[];
}

export interface ProjectMediaEntity {
  audios: AudioEntity[];
  videos: VideoEntity[];
}

export enum ProjectStatus {
  FINISHED = 'finished',
  LIVE = 'live',
  WAITING = 'waiting',
  DRAFT = 'draft',
  PROCESSING = 'processing',
  ERROR = 'error',
}
