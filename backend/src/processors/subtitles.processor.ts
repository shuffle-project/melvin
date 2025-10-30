import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { rm } from 'fs/promises';
import { TranscriptionStatus } from 'src/modules/db/schemas/transcription.schema';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { DbService } from '../modules/db/db.service';
import { Project } from '../modules/db/schemas/project.schema';
import { CustomLogger } from '../modules/logger/logger.service';
import { PathService } from '../modules/path/path.service';
import { SpeechToTextService } from '../modules/speech-to-text/speech-to-text.service';
import { ImportSubtitlesService } from '../modules/subtitle-format/import-subtitles.service';
import { TranslationService } from '../modules/translation/translation.service';
import { ActivityService } from '../resources/activity/activity.service';
import { AuthUser } from '../resources/auth/auth.interfaces';
import { AuthService } from '../resources/auth/auth.service';
import { EventsGateway } from '../resources/events/events.gateway';
import { ProjectService } from '../resources/project/project.service';
import { TranscriptionEntity } from '../resources/transcription/entities/transcription.entity';
import { TranscriptionService } from '../resources/transcription/transcription.service';
import {
  AlignPayload,
  AsrPayload,
  AsrVendors,
  CopyPayload,
  FilePayload,
  ProcessProjectJob,
  ProcessSubtitlesJob,
  SubtitlesType,
  TranslationPayload,
} from './processor.interfaces';

@Processor('subtitles')
export class SubtitlesProcessor {
  constructor(
    private logger: CustomLogger,
    private transcriptionService: TranscriptionService,
    private speechToTextService: SpeechToTextService,
    private authService: AuthService,
    private importSubtitlesService: ImportSubtitlesService,
    private projectService: ProjectService,
    private pathService: PathService,
    private translationService: TranslationService,
    private activityService: ActivityService,
    private events: EventsGateway,
    private db: DbService,
    private tiptapService: TiptapService,
    @InjectQueue('project') private projectQueue: Queue<ProcessProjectJob>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process({ concurrency: 3 })
  async processSubtitles(job: Job<ProcessSubtitlesJob>) {
    const systemUser = await this.authService.findSystemAuthUser();
    const { project, transcription, payload } = job.data;

    switch (payload.type) {
      case SubtitlesType.FROM_FILE:
        this.logger.verbose(
          `Subtitle creation: Job ${job.id}, Creation Type: File`,
        );
        await this._generateCaptionsFromFile(
          systemUser,
          transcription,
          payload,
        );
        break;
      case SubtitlesType.FROM_ASR:
        this.logger.verbose(
          `Subtitle creation: Job ${job.id}, Creation Type: From ASR, Vendor (${payload.vendor})`,
        );
        await this._generateCaptionsFromASR(project, transcription, payload);
        break;
      case SubtitlesType.FROM_TRANSLATION:
        this.logger.verbose(
          `Subtitle creation: Job ${job.id}, Creation Type: Translation from Transcription ${payload.sourceTranscriptionId}`,
        );

        await this._generateCaptionsFromTranslation(
          project,
          transcription,
          payload,
        );
        break;
      case SubtitlesType.FROM_COPY:
        this.logger.verbose(
          `Subtitle creation: Job ${job.id}, Creation Type: Copy from Transcription ${payload.sourceTranscriptionId}`,
        );
        await this._generateCaptionsFromCopy(project, transcription, payload);
        break;

      case SubtitlesType.ALIGN:
        this.logger.verbose(
          `Subtitle creation: Job ${job.id}, Creation Type: Align Transcription ${payload.transcriptionId}`,
        );

        await this._alignCaptions(project, transcription, payload);
        break;
    }

    // Send event of new transcription
    const updatedTranscription = await this.transcriptionService.findOne(
      systemUser,
      transcription._id.toString(),
    );
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);
    this.events.transcriptionUpdated(project, entity);
  }

  @OnQueueActive()
  async activeHandler(job: Job<ProcessSubtitlesJob>) {
    const { project, transcription } = job.data;

    if (transcription.status !== TranscriptionStatus.PROCESSING) {
      await this.db.transcriptionModel
        .findByIdAndUpdate(transcription._id, {
          $set: {
            status: TranscriptionStatus.PROCESSING,
          },
        })
        .lean()
        .exec();
    }

    const systemUser = await this.authService.findSystemAuthUser();
    const updatedTranscription = await this.transcriptionService.findOne(
      systemUser,
      transcription._id.toString(),
    );
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);
    this.events.transcriptionUpdated(project, entity);

    this.logger.verbose(
      `Subtitle creation START: Job ${
        job.id
      }, ProjectId: ${project._id.toString()}`,
    );
  }

  @OnQueueCompleted()
  async completeHandler(job: Job<ProcessSubtitlesJob>, result: any) {
    const { project, payload, transcription } = job.data;
    const systemUser = await this.authService.findSystemAuthUser();

    await this.activityService.create(
      project,
      systemUser.id,
      'subtitles-processing-finished',
      { transcription: job.data.transcription },
    );

    if (
      job.data.payload.type === SubtitlesType.FROM_COPY ||
      job.data.payload.type === SubtitlesType.FROM_FILE
    ) {
      await this.db.transcriptionModel
        .findByIdAndUpdate(transcription._id, {
          $set: {
            status: TranscriptionStatus.OK,
          },
        })
        .lean()
        .exec();
    }

    const updatedTranscription = await this.transcriptionService.findOne(
      systemUser,
      transcription._id.toString(),
    );
    const entity = plainToInstance(TranscriptionEntity, updatedTranscription);
    this.events.transcriptionUpdated(project, entity);

    // remove temp file
    if (payload.type === SubtitlesType.FROM_FILE) {
      const { file } = payload;

      const uploadDir = this.pathService.getUploadDirectory(file.uploadId);

      await rm(uploadDir, { recursive: true });
    }

    this.logger.verbose(
      `Subtitle creation DONE: Job ${
        job.id
      }, ProjectId: ${project._id.toString()}, Result: ${result}`,
    );
  }

  @OnQueueFailed()
  async failHandler(job: Job<ProcessSubtitlesJob>, err: Error) {
    const { project, transcription } = job.data;

    const systemUser = await this.authService.findSystemAuthUser();

    await this.activityService.create(
      project,
      systemUser.id,
      'subtitles-processing-failed',
      { error: err },
    );

    try {
      await this.db.transcriptionModel
        .findByIdAndUpdate(transcription._id, {
          $set: {
            status: TranscriptionStatus.ERROR,
          },
        })
        .lean()
        .exec();

      this.logger.error(
        `Subtitle creation FAIL: Job ${
          job.id
        }, ProjectId: ${project._id.toString()}, Error: ${err.name} - ${
          err.message
        }`,
      );
      this.logger.error(err.stack);
    } catch (err) {
      this.logger.error(err);
    }
  }

  // generate captions
  async _generateCaptionsFromFile(
    systemUser: AuthUser,
    transcription: TranscriptionEntity,
    payload: FilePayload,
  ) {
    const updatedTranscription = await this.transcriptionService.createSpeakers(
      systemUser,
      transcription._id.toString(),
      {
        names: ['Person 1'],
      },
    );
    await this.importSubtitlesService.fromFile(
      systemUser,
      payload.file,
      updatedTranscription._id.toString(),
      updatedTranscription.speakers[0]._id.toString(),
    );
  }

  async _generateCaptionsFromASR(
    project: Project,
    transcription: TranscriptionEntity,
    payload: AsrPayload,
  ) {
    const systemUser = await this.authService.findSystemAuthUser();
    const updatedTranscription = await this.transcriptionService.createSpeakers(
      systemUser,
      transcription._id.toString(),
      {
        names: ['Person 1'],
      },
    );

    await this.speechToTextService.generate(
      project,
      updatedTranscription,
      payload.audio,
      payload.vendor,
    );
  }

  async _generateCaptionsFromTranslation(
    project: Project,
    target: TranscriptionEntity,
    payload: TranslationPayload,
  ) {
    const sysUser = await this.authService.findSystemAuthUser();
    const source = await this.transcriptionService.findOne(
      sysUser,
      payload.sourceTranscriptionId,
    );

    target.language = payload.targetLanguage;

    await this.translationService.translateTranscription(
      project,
      source,
      target,
      payload,
    );
  }

  async _generateCaptionsFromCopy(
    project: Project,
    target: TranscriptionEntity,
    payload: CopyPayload,
  ) {
    const sysUser = await this.authService.findSystemAuthUser();
    const sourceTranscription = await this.transcriptionService.findOne(
      sysUser,
      payload.sourceTranscriptionId,
    );

    target = await this.transcriptionService.createSpeakers(
      sysUser,
      target._id.toString(),
      { names: sourceTranscription.speakers.map((obj) => obj.name) },
    );

    const mappedSpeaker = target.speakers.map((targetSpeaker) => {
      return {
        source: sourceTranscription.speakers.find(
          (sourceSpeaker) => sourceSpeaker.name === targetSpeaker.name,
        )._id,
        target: targetSpeaker._id,
      };
    });

    const sourceTiptapDoc = await this.tiptapService.getTiptapDocument(
      sourceTranscription._id.toString(),
    );

    sourceTiptapDoc.content.forEach((node) => {
      if (node.attrs.speakerId) {
        const mapped = mappedSpeaker.find(
          (mapping) => mapping.source.toString() === node.attrs.speakerId,
        );
        if (mapped) node.attrs.speakerId = mapped.target.toString();
      }
    });

    await this.tiptapService.updateDocument(
      target._id.toString(),
      sourceTiptapDoc,
    );
  }

  async _alignCaptions(
    project: Project,
    target: TranscriptionEntity,
    payload: AlignPayload,
  ) {
    const targetLang = target.language.includes('-')
      ? target.language.split('-')[0]
      : target.language;
    const projectLang = project.language.includes('-')
      ? project.language.split('-')[0]
      : project.language;

    if (targetLang !== projectLang) {
      this.logger.error(
        'Language of transcription and project do not match, cannot align',
      );
    } else {
      await this.speechToTextService.align(
        project,
        target,
        payload.audio,
        AsrVendors.WHISPER,
        payload.transcriptToAlign,
      );
    }
  }
}
