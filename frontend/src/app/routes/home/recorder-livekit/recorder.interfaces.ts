import { HttpErrorResponse } from '@angular/common/http';
import { LocalTrack } from 'livekit-client';
import {
  MediaCategory,
  ProjectEntity,
} from '../../../services/api/entities/project.entity';

export interface SourceObject {
  id: string;
  title: string;
}

export interface AudioSource extends SourceObject {
  type: 'audio';
  label: string;
  audioTrack: LocalTrack;
}

export interface VideoSource extends SourceObject {
  type: 'video';
  label: string;
  mediaCategory: MediaCategory;
  videoTrack: LocalTrack;
}

export interface ScreenSource extends SourceObject {
  type: 'screen';
  mediaCategory: MediaCategory;
  videoTrack: LocalTrack;
  audioTrack?: LocalTrack;
}

export interface Recording {
  id: string;
  title: string;
  category: MediaCategory;
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
  complete: boolean;
  upload: {
    progress: number;
    result?: ProjectEntity;
    error?: HttpErrorResponse;
  };
}
