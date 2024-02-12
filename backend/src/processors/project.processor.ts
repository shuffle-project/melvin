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
import { DbService } from '../modules/db/db.service';
import {
  Audio,
  MediaCategory,
  MediaStatus,
  ProjectStatus,
} from '../modules/db/schemas/project.schema';
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
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process()
  async processProject(job: Job<ProcessProjectJob>) {
    const { project, file, mainVideo, mainAudio } = job.data;
    const projectId = project._id.toString();
    const systemUser = await this.authService.findSystemAuthUser();

    // process video

    await this.projectService._updateMedia(
      projectId,
      mainVideo,
      MediaStatus.PROCESSING,
    );
    await this.ffmpegService.processVideoFile(file.path, projectId, mainVideo);
    await this.projectService._updateMedia(
      projectId,
      mainVideo,
      MediaStatus.FINISHED,
    );

    // stop if it is not the main video
    if (mainVideo.category !== MediaCategory.MAIN) {
      return null;
    }

    //get duration via ffprobe
    const duration = await this.ffmpegService.getVideoDuration(
      projectId,
      mainVideo,
    );

    // set duration in project
    await this.projectService.update(systemUser, projectId, {
      duration,
    });

    if (mainAudio) {
      await this.projectService._updateMedia(
        projectId,
        mainAudio,
        MediaStatus.PROCESSING,
      );
      await this.ffmpegService.createMp3File(projectId, mainVideo, mainAudio);

      await this.generateWaveformData(job.data, mainAudio);
      await this.projectService._updateMedia(
        projectId,
        mainAudio,
        MediaStatus.FINISHED,
      );
    }

    const updatedProject = await this.db.projectModel.findById(projectId);

    //push to subtitles queue with updated project
    job.data.subsequentJobs.forEach((job) =>
      this.subtitlesQueue.add({ ...job, project: updatedProject }),
    );

    return null;
  }

  @OnQueueActive()
  async activeHandler(job: Job<ProcessProjectJob>) {
    const { project } = job.data;
    const projectId = project._id.toString();

    const systemUser = await this.authService.findSystemAuthUser();

    try {
      await this.projectService.update(systemUser, projectId, {
        status: ProjectStatus.PROCESSING,
      });
    } catch (err) {
      console.log(err);
    }

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

  async generateWaveformData(data: ProcessProjectJob, audio: Audio) {
    const { project } = data;
    const projectId = project._id.toString();

    const waveformPath = this.pathService.getWaveformFile(projectId, audio);

    const generatedData: WaveformData =
      await this.ffmpegService.getWaveformData(project, audio);

    await writeFile(waveformPath, JSON.stringify(generatedData));
  }
}
