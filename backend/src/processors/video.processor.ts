import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bull';
import { exists } from 'fs-extra';
import { DbService } from '../modules/db/db.service';
import { FfmpegService } from '../modules/ffmpeg/ffmpeg.service';
import { CustomLogger } from '../modules/logger/logger.service';
import { PathService } from '../modules/path/path.service';
import { AuthService } from '../resources/auth/auth.service';
import { ProjectService } from '../resources/project/project.service';
import { ProcessVideoJob } from './processor.interfaces';
@Processor('video')
export class VideoProcessor {
  constructor(
    private logger: CustomLogger,
    private ffmpegService: FfmpegService,
    private pathService: PathService,
    private projectService: ProjectService,
    private authService: AuthService,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process()
  async processVideo(job: Job<ProcessVideoJob>) {
    let { projectId, video, skipLowestResolution } = job.data;

    const filepath = this.pathService.getBaseMediaFile(projectId, video);
    const calcRes = await this.ffmpegService.getCalculatedResolutions(filepath);

    // remove the lowest resolution, since that is already created inside the projectprocessor
    if (skipLowestResolution) calcRes.shift();

    if (calcRes.length === 0) {
      this.logger.verbose(
        `Further processing is not needed, since 240p is the lowest resolution`,
      );
      return;
    }

    const fileExists = await exists(filepath);
    if (!fileExists) {
      this.logger.error(`Can't process file, file does not exist: ${filepath}`);
      return;
    }

    await this.ffmpegService.processVideoFile(
      filepath,
      projectId,
      video,
      calcRes,
    );
  }

  @OnQueueActive()
  async activeHandler(job: Job<ProcessVideoJob>) {
    let { projectId, video } = job.data;

    this.logger.verbose(
      `Video processing START: Job ${job.id}, ProjectId: ${projectId}, Video ${video._id}`,
    );
  }

  @OnQueueCompleted()
  async completeHandler(job: Job<ProcessVideoJob>, result: any) {
    let { projectId, video } = job.data;

    this.logger.verbose(
      `Video processing DONE: Job ${job.id}, ProjectId: ${projectId}, Result: ${result}, Video ${video._id}`,
    );

    const count = await job.queue.getJobCounts();
    this.logger.info(
      'VideoJobs left: ' + (count.active + count.waiting + count.delayed),
    );
  }

  @OnQueueFailed()
  async failHandler(job: Job<ProcessVideoJob>, err: Error) {
    let { projectId, video } = job.data;

    this.logger.error(
      `Video processing FAIL: Job ${job.id}, ProjectId: ${projectId}, Video: ${video._id} , Errormessage: ${err.message}`,
    );
    this.logger.error('Stack:');
    this.logger.error(err.stack);
  }
}
