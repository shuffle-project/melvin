import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { v4 } from 'uuid';
import { Audio, Video } from '../db/schemas/project.schema';
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

  getMediaFile(projectId: string, media: Audio | Video): string {
    const filename = media._id + '.' + media.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getFileWithExt(projectId: string, fileId: string, extension: string): string {
    return join(this.getProjectDirectory(projectId), fileId + '.' + extension);
  }

  getFile(projectId: string, filename: string): string {
    return join(this.getProjectDirectory(projectId), filename);
  }

  getWaveformFile(projectId: string, audio: Audio) {
    return join(this.getProjectDirectory(projectId), audio._id + '.json');
  }

  getRecordingFile(projectId: string) {
    return join(this.getKurentoDirectory(projectId), 'recording.mp4');
  }
}
