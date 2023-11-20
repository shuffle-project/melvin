import { MediaCategory } from '../../../services/api/entities/project.entity';

export interface SourceObj {
  type: 'audioinput' | 'videoinput' | 'screensharinginput';
  title: string;
  mediaStream: MediaStream;
  mediaCategory?: MediaCategory;
  mediaDeviceInfo?: MediaDeviceInfo;
}
