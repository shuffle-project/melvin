import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { v4 } from 'uuid';
import { Export } from '../db/schemas/export.schema';
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

  getRootProjectDirectory(): string {
    return MEDIA_PROJECTS_DIR;
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

  getVideoFile(projectId: string, video: Video, resolution?: string): string {
    if (!resolution) resolution = video.resolutions[0].resolution;
    const filename = video._id + '_' + resolution + '.' + video.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getHighResVideoFile(projectId: string, video: Video): string {
    const sorted = video.resolutions.sort((a, b) => b.height - a.height);

    const filename =
      video._id + '_' + sorted[0].resolution + '.' + video.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getLowResVideoFile(projectId: string, video: Video): string {
    const sorted = video.resolutions.sort((a, b) => a.height - b.height);

    const filename =
      video._id + '_' + sorted[0].resolution + '.' + video.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getBaseAudioFile(projectId: string, audio: Audio): string {
    const filename = audio._id + '.' + audio.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getAudioFile(projectId: string, audio: Audio, stereo: boolean): string {
    const type = stereo ? '_stereo' : '_mono';
    const filename = audio._id + type + '.' + audio.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  getBaseMediaFile(projectId: string, media: Audio | Video | Export): string {
    const filename = media._id + '.' + media.extension;
    return join(this.getProjectDirectory(projectId), filename);
  }

  // getMediaFile(projectId: string, media: Audio | Export): string {
  //   const filename = media._id + '.' + media.extension;
  //   return join(this.getProjectDirectory(projectId), filename);
  // }

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
