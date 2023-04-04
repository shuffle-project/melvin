import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, JobStatus, Queue } from 'bull';
import { rm } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { ProjectStatus } from '../modules/db/schemas/project.schema';
import { WaveformData } from '../modules/ffmpeg/ffmpeg.interfaces';
import { FfmpegService } from '../modules/ffmpeg/ffmpeg.service';
import { CustomLogger } from '../modules/logger/logger.service';
import { PathService } from '../modules/path/path.service';
import { ActivityService } from '../resources/activity/activity.service';
import { AuthService } from '../resources/auth/auth.service';
import { ProjectService } from '../resources/project/project.service';
import { ProcessProjectJob, ProcessSubtitlesJob } from './processor.interfaces';
import { jobWithProjectIdExists } from './processor.utils';
@Processor('project')
export class ProjectProcessor {
  constructor(
    private logger: CustomLogger,
    private ffmpegService: FfmpegService,
    private pathService: PathService,
    private projectService: ProjectService,
    private authService: AuthService,
    private activityService: ActivityService,
    @InjectQueue('subtitles')
    private subtitlesQueue: Queue<ProcessSubtitlesJob>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process()
  async processProject(job: Job<ProcessProjectJob>) {
    const { project, file } = job.data;
    const projectId = project._id.toString();
    const systemUser = await this.authService.findSystemAuthUser();

    // process video
    await this.ffmpegService.processVideoFile(file.path, projectId);

    // create wav
    await this.ffmpegService.createWavFile(file.path, projectId);

    //get duration via ffprobe
    const duration = await this.ffmpegService.getVideoDuration(projectId);
    // set duration in project
    const updatedProject = await this.projectService.update(
      systemUser,
      projectId,
      {
        duration,
      },
    );

    //push to subtitles queue with updated project
    job.data.subsequentJobs.forEach((job) =>
      this.subtitlesQueue.add({ ...job, project: updatedProject }),
    );

    await this.generateWaveformData(job.data);

    return null;
  }

  @OnQueueActive()
  async activeHandler(job: Job<ProcessProjectJob>) {
    const { project } = job.data;
    const projectId = project._id.toString();

    const systemUser = await this.authService.findSystemAuthUser();

    await this.projectService.update(systemUser, projectId, {
      status: ProjectStatus.PROCESSING,
    });

    this.logger.verbose(
      `Video processing START: Job ${job.id}, ProjectId: ${projectId}`,
    );
  }

  @OnQueueCompleted()
  async completeHandler(job: Job<ProcessProjectJob>, result: any) {
    const { project, file } = job.data;
    const projectId = project._id.toString();

    const systemUser = await this.authService.findSystemAuthUser();

    await this.activityService.create(
      project,
      systemUser.id,
      'video-processing-finished',
      {},
    );

    const jobTypes: JobStatus[] = ['active', 'paused', 'waiting', 'delayed'];
    const projectJobs = await job.queue.getJobs(jobTypes);
    const subtitleJobs = await this.subtitlesQueue.getJobs(jobTypes);

    // if there are no more project jobs, set status to draft
    const projectJobExists = jobWithProjectIdExists(
      projectId,
      subtitleJobs,
      projectJobs,
    );

    if (!projectJobExists) {
      await this.projectService.update(systemUser, projectId, {
        status: ProjectStatus.DRAFT,
      });
    }

    // remove temp file
    await rm(file.destination, { recursive: true });

    this.logger.verbose(
      `Video processing DONE: Job ${job.id}, ProjectId: ${projectId}, Result: ${result}`,
    );
  }

  @OnQueueFailed()
  async failHandler(job: Job<ProcessProjectJob>, err: Error) {
    const { project } = job.data;
    const projectId = project._id.toString();

    const systemUser = await this.authService.findSystemAuthUser();

    await this.activityService.create(
      project,
      systemUser.id,
      'video-processing-failed',
      { error: err },
    );

    await this.projectService.update(systemUser, projectId, {
      status: ProjectStatus.ERROR,
    });

    this.logger.error(
      `Video processing FAIL: Job ${job.id}, ProjectId: ${projectId}, Errormessage: ${err.message}`,
    );
    this.logger.error('Stack:');
    this.logger.error(err.stack);
  }

  async generateWaveformData(data: ProcessProjectJob) {
    const { project } = data;
    const projectId = project._id.toString();

    const waveformPath = this.pathService.getWaveformFile(projectId);

    const generatedData: WaveformData =
      await this.ffmpegService.getWaveformData(projectId);

    await writeFile(waveformPath, JSON.stringify(generatedData));
  }
}
