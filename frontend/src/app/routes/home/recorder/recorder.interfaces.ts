import { MediaCategory } from '../../../services/api/entities/project.entity';

export interface SourceObject {
  id: string;
  title: string;

  mediaStream: MediaStream | null;
}

export interface AudioSource extends SourceObject {
  deviceId: string;
  label: string;
}

export interface VideoSource extends SourceObject {
  deviceId: string;
  label: string;
  mediaCategory: MediaCategory;
}

export interface ScreensharingSource extends SourceObject {
  mediaCategory: MediaCategory;
}
