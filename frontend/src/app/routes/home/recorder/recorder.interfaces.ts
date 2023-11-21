import { MediaCategory } from '../../../services/api/entities/project.entity';

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
}
