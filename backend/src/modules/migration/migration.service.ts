import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { exists, move } from 'fs-extra';
import { rm, statfs } from 'fs/promises';
import {
  ProcessSubtitlesJob,
  ProcessVideoJob,
} from '../../processors/processor.interfaces';
import { generateSecureToken } from '../../utils/crypto';
import { DbService } from '../db/db.service';
import {
  Audio,
  MediaCategory,
  Project,
  ProjectStatus,
  Video,
} from '../db/schemas/project.schema';
import { TranscriptionStatus } from '../db/schemas/transcription.schema';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';
import { WhisperSpeechService } from '../speech-to-text/whisper/whisper-speech.service';
import { TiptapService } from '../tiptap/tiptap.service';

@Injectable()
export class MigrationService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private tiptapService: TiptapService,
    private whisper: WhisperSpeechService,
    private ffmpegService: FfmpegService,
    private pathService: PathService,
    @InjectQueue('subtitles')
    private subtitlesQueue: Queue<ProcessSubtitlesJob>,
    @InjectQueue('video')
    private videoQueue: Queue<ProcessVideoJob>,
  ) {
    this.logger.setContext('Migration');
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.info('Initialize migration check');
    let settings = await this.db.settingsModel.findOne({});

    if (settings === null) {
      this.logger.info('First application start');
      settings = await this.db.settingsModel.create({ dbSchemaVersion: 1 });
    }

    // Fix for legacy migration
    if (settings.dbSchemaVersion === undefined) {
      this.logger.info('Fix dbSchemaVersion');
      settings.dbSchemaVersion = 1;
      await settings.save();
      this.logger.info('Fix dbSchemaVersion successful');
    }

    if (settings.dbSchemaVersion < 2) {
      this.logger.info('Migrate to version 2');
      const projects = await this.db.projectModel.find({});
      for (const project of projects) {
        project.inviteToken = generateSecureToken();
        project.viewerToken = generateSecureToken();
        await project.save();
      }
      settings.dbSchemaVersion = 2;
      await settings.save();
      this.logger.info('Migration to version 2 successful');
    }

    // if (settings.dbSchemaVersion < 3) {
    //   this.logger.info('Migrate to version 3');
    //   await this._migrateToV3Tiptap();

    //   settings.dbSchemaVersion = 3;
    //   await settings.save();
    //   this.logger.info('Migration to version 3 successful');
    // }

    if (settings.dbSchemaVersion < 4) {
      this.logger.info('Migrate to version 4 - language tags');
      await this._migrateLanguageTags();

      settings.dbSchemaVersion = 4;
      await settings.save();
      this.logger.info('Migration to version 4 successful');
    }

    if (settings.dbSchemaVersion < 5) {
      this.logger.info(
        'Migrate to version 5 - create video in several resolutions and generate audio in stereo/mono ',
      );

      await this._migrateVideoAudioFiles();

      settings.dbSchemaVersion = 5;
      await settings.save();
      this.logger.info('Migration to version 5 successful');
    }

    if (settings.dbSchemaVersion < 6) {
      this.logger.info(
        'Migrate to version 6 - reprocess all videos to repair broken videos',
      );

      await this._migrateReprocessVideos();

      settings.dbSchemaVersion = 6;
      await settings.save();
      this.logger.info('Migration to version 6 successful');
    }

    if (settings.dbSchemaVersion < 7) {
      this.logger.info('Migrate to version 7 - set transcription status');

      await this.db.transcriptionModel
        .updateMany(
          {},
          {
            $set: {
              status: TranscriptionStatus.OK,
            },
          },
        )
        .exec();

      settings.dbSchemaVersion = 7;
      await settings.save();
      this.logger.info('Migration to version 7 successful');
    }

    if (settings.dbSchemaVersion < 8) {
      this.logger.info(
        'Migrate to version 8 - set isEmailVerified for existing users to true',
      );

      await this.db.userModel
        .updateMany({}, { $set: { isEmailVerified: true } })
        .exec();

      settings.dbSchemaVersion = 8;
      await settings.save();
      this.logger.info('Migration to version 8 successful');
    }

    if (settings.dbSchemaVersion < 9) {
      this.logger.info(
        'Migrate to version 9 - add sizeInBytes for videos and audios',
      );

      const projects = await this.db.projectModel.find();
      projects.forEach(async (project) => {
        for (let index = 0; index < project.videos.length; index++) {
          const video = project.videos[index];
          const videoSize = await this.ffmpegService._getByteSizeByPrefix(
            project._id.toString(),
            video._id.toString(),
          );
          video.sizeInBytes = videoSize;
        }

        for (let index = 0; index < project.audios.length; index++) {
          const audio = project.audios[index];
          const audioSize = await this.ffmpegService._getByteSizeByPrefix(
            project._id.toString(),
            audio._id.toString(),
          );
          audio.sizeInBytes = audioSize;
        }

        await project.save();
      });
      settings.dbSchemaVersion = 9;
      await settings.save();
      this.logger.info('Migration to version 9 successful');
    }
  }

  private async _migrateReprocessVideos() {
    const projects = await this.db.projectModel.find({
      status: [
        ProjectStatus.DRAFT,
        ProjectStatus.FINISHED,
        ProjectStatus.PROCESSING,
        ProjectStatus.WAITING,
      ],
    });
    this.logger.info('Projects found: ' + projects.length);

    const processVideoJobs: ProcessVideoJob[] = [];
    for (const project of projects) {
      // projects.forEach(async (project) => {
      // const projectDir = this.pathService.getProjectDirectory(
      //   project._id.toString(),
      // );
      // const dirExists = await exists(projectDir);
      // console.log(
      //   'dirExists ' + project.title + ' - ' + project._id.toString(),
      //   dirExists,
      // );
      for (const video of project.videos) {
        // project.videos.forEach(async (video) => {
        try {
          this.logger.info(
            'Reprocess project/video: ' +
              project._id.toString() +
              ' / ' +
              video._id.toString(),
          );
          // reprocess base video file
          const path = this.pathService.getBaseMediaFile(
            project._id.toString(),
            video,
          );

          const tempPath = path.replace('.mp4', '_temp.mp4');
          await move(path, tempPath);

          await this.ffmpegService.processBaseFile(
            project._id.toString(),
            tempPath,
            path,
            true,
          );
          await rm(tempPath);

          // add to processVideoQueue to reprocess video resolutions
          processVideoJobs.push({
            projectId: project._id.toString(),
            video,
            skipLowestResolution: false,
          });
        } catch (e) {
          this.logger.error(
            'Error while reprocessing video: ' +
              project._id.toString() +
              ' / ' +
              video._id.toString(),
          );
          this.logger.error(e);
        }
      } //)
    } //)
    this.logger.info(
      'Base video files reprocessed, now reprocess video resolutions',
    );
    processVideoJobs.forEach((job) => {
      this.videoQueue.add(job);
    });
  }

  private async _migrateVideoAudioFiles() {
    const projects = await this.db.projectModel.find({
      status: [
        ProjectStatus.DRAFT,
        ProjectStatus.FINISHED,
        ProjectStatus.PROCESSING,
        ProjectStatus.WAITING,
      ],
    });
    this.logger.info('Projects found: ' + projects.length);
    const processVideoJobs: ProcessVideoJob[] = [];
    for (const project of projects) {
      const projectId = project._id.toString();
      /**
       * audio
       */
      for (const audio of project.audios) {
        await this._runAudio(project, audio);
      }

      /**
       * video
       */
      for (const video of project.videos) {
        await this._runVideo(video, project, processVideoJobs);
      }
    }

    // push every video to videoQueue, to process higher quality videos
    processVideoJobs.forEach((job) => {
      this.videoQueue.add(job);
    });
  }

  private async _migrateLanguageTags() {
    const projects = await this.db.projectModel.find({});
    for (const project of projects) {
      if (
        project.language === 'de-DE' ||
        project.language === 'es-ES' ||
        project.language === 'fr-FR'
      ) {
        project.language = project.language.split('-')[0];
        project.save();
      }
      if (project.language === 'en') {
        project.language = 'en-US';
        project.save();
      }
    }
  }

  private async _runAudio(project: Project, audio: Audio) {
    try {
      const mainVideo = project.videos.find(
        (video) => video.category === MediaCategory.MAIN,
      );

      const baseAudioFile = this.pathService.getBaseAudioFile(
        project._id.toString(),
        audio,
      );
      const baseVideoFile = this.pathService.getBaseMediaFile(
        project._id.toString(),
        mainVideo,
      );
      const stereoAudioFile = this.pathService.getAudioFile(
        project._id.toString(),
        audio,
        true,
      );
      const monoAudioFile = this.pathService.getAudioFile(
        project._id.toString(),
        audio,
        false,
      );
      // const audioBase = await exists(this.pathService.getBaseAudioFile(
      const videoBaseExists = await exists(baseVideoFile);
      const stereoExists = await exists(stereoAudioFile);
      const monoExists = await exists(monoAudioFile);

      const baseStats = await statfs(baseVideoFile);

      if (videoBaseExists && (!stereoExists || !monoExists)) {
        await this.ffmpegService.createMp3File(
          project._id.toString(),
          mainVideo,
          audio,
        );
        this.logger.verbose(
          'stereo/mono audio files created for projectId/audioId: ' +
            project._id.toString() +
            '/' +
            audio._id.toString(),
        );

        // remove base audio file after
        rm(baseAudioFile);
        this.logger.verbose('deleting base audio file: ' + baseAudioFile);
      } else {
        this.logger.verbose('Skip generation of stereo/mono audio files');
        this.logger.verbose('File exists: ' + videoBaseExists);
        this.logger.verbose('Stereo exists: ' + stereoExists);
        this.logger.verbose('Mono exists: ' + monoExists);
      }
    } catch (error) {
      this.logger.error(
        'Error while creating audio files for project: ' +
          project._id.toString(),
      );
      this.logger.error(error);
    }
  }

  private async _runVideo(
    video: Video,
    project: Project,
    processVideoJobs: ProcessVideoJob[],
  ) {
    try {
      this.logger.verbose('Video ' + video._id.toString());
      const baseMediaFile = this.pathService.getBaseMediaFile(
        project._id.toString(),
        video,
      );

      const resolution = await this.ffmpegService._getVideoResolution(
        baseMediaFile,
      );
      if (resolution.height === 0) {
        this.logger.verbose('Video has no resolution, processing to video');
        await this.ffmpegService.processAudioToVideo(
          project._id.toString(),
          baseMediaFile,
          baseMediaFile,
        );
      }

      const possibleResolutions = [240, 360, 480, 720, 1080].map((res) =>
        this.pathService.getVideoFile(project._id.toString(), video, res + 'p'),
      );

      const fileExists = await exists(baseMediaFile);
      const resolutionsExist = await exists(possibleResolutions[0]);

      this.logger.verbose('File exists: ' + fileExists);
      this.logger.verbose('Resolutions exist: ' + resolutionsExist);

      if (fileExists) {
        // if (fileExists && !resolutionsExist) {
        const calcRes = await this.ffmpegService.getCalculatedResolutions(
          baseMediaFile,
        );

        await this.ffmpegService.processVideoFile(
          baseMediaFile,
          project._id.toString(),
          video,
          [calcRes[0]],
        );

        this.logger.verbose('Process 240p video done');

        processVideoJobs.push({
          projectId: project._id.toString(),
          video,
          skipLowestResolution: true,
        });
        // await rm(baseMediaFile);
        // this.logger.info('deleted: ' + baseMediaFile);
      }
    } catch (e) {
      this.logger.error(
        'Error while creating resolutions for project: ' +
          project._id.toString(),
      );
      this.logger.error(e);
    }
  }

  // private async _migrateToV3Tiptap() {
  //   const transcriptions = await this.db.transcriptionModel.find({});
  //   for (const transcription of transcriptions) {
  //     const captions = await this.db.captionModel.find({
  //       transcription: transcription._id,
  //     });

  //     if (
  //       captions.length > 0 &&
  //       (transcription.ydoc === undefined || transcription.ydoc === null)
  //     ) {
  //       const project = await this.db.projectModel
  //         .findById(transcription.project)
  //         .exec();

  //       const text = captions
  //         .map((caption) => {
  //           return caption.text;
  //         })
  //         .join(' ');

  //       const transcriptToAlign: MelvinAsrTranscript = {
  //         text,
  //         segments: [
  //           {
  //             text,
  //             start: 0,
  //             end: 0,
  //             words: text
  //               .split(' ')
  //               .map((w) => ({ text: w, start: 0, end: 0 })),
  //           },
  //         ],
  //       };

  //       /**
  //        *
  //        */

  //       this.logger.info(
  //         'Add align job to queue for transcription ' +
  //           transcription._id.toString(),
  //       );
  //       if (project) {
  //         project.status = ProjectStatus.WAITING;
  //         await project.save();

  //         const payload: AlignPayload = {
  //           type: SubtitlesType.ALIGN,
  //           audio: project.audios[0],
  //           transcriptionId: transcription._id.toString(),
  //           transcriptToAlign,
  //           syncSpeaker: captions,
  //         };
  //         this.subtitlesQueue.add({
  //           project: project,
  //           transcription: transcription,
  //           payload,
  //         });
  //       } else {
  //         console.log('project does not exist', transcription.project, project);
  //       }
  //     }
  //   }
  // }
}
