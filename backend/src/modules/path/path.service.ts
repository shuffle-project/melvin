import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { v4 } from 'uuid';
import { CustomLogger } from '../logger/logger.service';

export const ROOT_DIR = join(__dirname, '../../..');
export const MEDIA_DIR = join(ROOT_DIR, 'media');
export const MEDIA_TEMP_DIR = join(MEDIA_DIR, 'temp');
export const MEDIA_PROJECTS_DIR = join(MEDIA_DIR, 'projects');
export const MEDIA_KURENTO_DIR = join(MEDIA_DIR, 'kurento');
export const ASSETS_DIR = join(ROOT_DIR, 'assets');

@Injectable()
export class PathService {
  constructor(private logger: CustomLogger) {
    this.logger.setContext(this.constructor.name);
  }

  getTempDirectory(): string {
    return join(MEDIA_TEMP_DIR, v4());
  }

  getProjectDirectory(projectId: string): string {
    return join(MEDIA_PROJECTS_DIR, projectId);
  }

  getKurentoDirectory(projectId: string): string {
    return join(MEDIA_KURENTO_DIR, projectId);
  }

  getAssetsDirectory(): string {
    return ASSETS_DIR;
  }

  getExampleProjectDirectory(): string {
    return join(this.getAssetsDirectory(), 'example-project');
  }

  getVideoFile(projectId: string): string {
    return join(this.getProjectDirectory(projectId), 'video.mp4');
  }

  getAdditionalVideoFile(projectId: string, videoId: string): string {
    return join(
      this.getProjectDirectory(projectId),
      'video' + videoId + '.mp4',
    );
  }

  getWavFile(projectId: string): string {
    return join(this.getProjectDirectory(projectId), 'audio.wav');
  }

  getWaveformFile(projectId: string) {
    return join(this.getProjectDirectory(projectId), 'waveform.json');
  }

  getRecordingFile(projectId: string) {
    return join(this.getKurentoDirectory(projectId), 'recording.mp4');
  }
}
