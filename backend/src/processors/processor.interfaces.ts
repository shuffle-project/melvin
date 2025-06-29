import { MelvinAsrTranscript } from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { UploadMetadata } from 'src/modules/upload/upload.interfaces';
import { CaptionEntity } from 'src/resources/caption/entities/caption.entity';
import { Audio, Project, Video } from '../modules/db/schemas/project.schema';
import { AuthUser } from '../resources/auth/auth.interfaces';
import { TranscriptionEntity } from '../resources/transcription/entities/transcription.entity';

export enum TranslateVendors {
  LIBRE = 'libreTranslate',
  DEEPL = 'deepl',
  GOOGLE = 'googleTranslate',
  MELVIN = 'melvin',
}

export enum AsrVendors {
  RANDOM = 'random',
  GOOGLE = 'google',
  ASSEMBLYAI = 'assemblyai',
  WHISPER = 'whisper',
}

// Subtitles Processor
export enum SubtitlesType {
  FROM_FILE = 'from_file',
  FROM_ASR = 'from_automatic_speech_recognition',
  FROM_TRANSLATION = 'from_translation',
  FROM_COPY = 'from_copy',
  ALIGN = 'align',
}

export interface FilePayload {
  type: SubtitlesType.FROM_FILE;
  file: UploadMetadata;
}
export interface AsrPayload {
  type: SubtitlesType.FROM_ASR;
  vendor: AsrVendors;
  audio: Audio;
}
export interface TranslationPayload {
  type: SubtitlesType.FROM_TRANSLATION;
  vendor: TranslateVendors;
  sourceTranscriptionId: string;
  targetLanguage: string;
}

export interface CopyPayload {
  type: SubtitlesType.FROM_COPY;
  sourceTranscriptionId: string;
}

export interface AlignPayload {
  type: SubtitlesType.ALIGN;
  transcriptionId: string;
  audio: Audio;
  // language: string; // take language of project
  // text?: string;
  transcriptToAlign?: MelvinAsrTranscript;
  syncSpeaker?: CaptionEntity[];
}

export interface ProcessSubtitlesJob {
  project: Project;
  transcription: TranscriptionEntity;
  payload:
    | FilePayload
    | AsrPayload
    | TranslationPayload
    | CopyPayload
    | AlignPayload
    | null;
}

// Project Processor
export interface ProcessProjectJob {
  project: Project;
  authUser: AuthUser;
  file: UploadMetadata;
  subsequentJobs: ProcessSubtitlesJob[];
  // videoId: string | null;
  mainVideo: Video;
  mainAudio?: Audio;
  recorder: boolean;
}

// Video Processor
export interface ProcessVideoJob {
  projectId: string;
  video: Video;
  skipLowestResolution: boolean;
}
