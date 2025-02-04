import { HttpErrorResponse } from '@angular/common/http';
import {
  MediaCategory,
  ProjectEntity,
} from '../../../services/api/entities/project.entity';

export interface SourceObject {
  id: string;
  title: string;
  mediaStream: MediaStream | null;
}

export interface AudioSource extends SourceObject {
  type: 'audio';
  deviceId: string;
  label: string;
}

export interface VideoSource extends SourceObject {
  type: 'video';
  deviceId: string;
  label: string;
  mediaCategory: MediaCategory;
}

export interface ScreensharingSource extends SourceObject {
  type: 'screensharing';
  mediaCategory: MediaCategory;
  sound: boolean;
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
