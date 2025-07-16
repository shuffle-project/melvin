import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { DbService } from 'src/modules/db/db.service';
import { Project } from 'src/modules/db/schemas/project.schema';
import { TranscriptionStatus } from 'src/modules/db/schemas/transcription.schema';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { TiptapDocument } from 'src/modules/tiptap/tiptap.interfaces';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { AuthService } from 'src/resources/auth/auth.service';
import { CaptionEntity } from 'src/resources/caption/entities/caption.entity';
import { EventsGateway } from 'src/resources/events/events.gateway';
import { TranscriptionEntity } from 'src/resources/transcription/entities/transcription.entity';
import { TranscriptionService } from 'src/resources/transcription/transcription.service';
import { CustomLogger } from '../modules/logger/logger.service';

export interface ProcessMelvinAsrJob {
  id: string;
  transcription: TranscriptionEntity;
  newSpeakerId?: string;
  syncSpeaker?: CaptionEntity[];
  project: Project;
  paragraphsViaTime: boolean;
}

@Processor('melvinAsr')
export class MelvinAsrProcessor {
  constructor(
    private logger: CustomLogger,
    private melvinAsrApiService: MelvinAsrApiService,
    private tiptapService: TiptapService,
    private db: DbService,
    private authService: AuthService,
    private transcriptionService: TranscriptionService,
    private events: EventsGateway,
    @InjectQueue('melvinAsr')
    private readonly melvinAsrQueue: Queue<ProcessMelvinAsrJob>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process('fetchResult')
  async fetchResult(job: Job<ProcessMelvinAsrJob>) {
    this.logger.verbose(
      `Start Fetching Result for transcription: "${job.data.transcription._id.toString()}"`,
    );

    const jobTemp = await this.melvinAsrApiService.getJob(job.data.id);

    if (jobTemp.status === 'in_progress' || jobTemp.status === 'pending') {
      await this.melvinAsrQueue.add(
        'fetchResult',
        { ...job.data },
        {
          delay: 10000, // 10 seconds
          attempts: 10,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
      return;
    }

    if (jobTemp.status === 'failed') {
      await this.db.transcriptionModel
        .findByIdAndUpdate(job.data.transcription._id, {
          $set: {
            status: TranscriptionStatus.ERROR,
          },
        })
        .lean()
        .exec();

      return;
    }

    if (jobTemp.status === 'completed') {
      const jobResult = await this.melvinAsrApiService.getJobResult(
        job.data.id,
      );

      await this.db.transcriptionModel
        .findByIdAndUpdate(job.data.transcription._id, {
          $set: {
            status: TranscriptionStatus.OK,
          },
        })
        .lean()
        .exec();

      if (!jobResult.transcript) {
        await this.db.transcriptionModel
          .findByIdAndUpdate(job.data.transcription._id, {
            $set: {
              status: TranscriptionStatus.ERROR,
            },
          })
          .lean()
          .exec();

        return;
      }

      const words = this.melvinAsrApiService.toWords(
        jobResult,
        job.data.paragraphsViaTime,
      );

      if (jobTemp.job_type === 'translation') {
        words.forEach((word) => {
          if (!word.text.endsWith(' ')) {
            word.text += ' ';
          }
        });
      }

      let document = this.tiptapService.wordsToTiptap(
        words,
        job.data.newSpeakerId ??
          job.data.transcription.speakers[0]._id.toString(),
      );

      if (job.data.syncSpeaker) {
        try {
          document = this._syncSpeaker(document, job.data.syncSpeaker);
        } catch (e) {
          this.logger.error(e);
        }
      }

      await this.tiptapService.updateDocument(
        job.data.transcription._id.toString(),
        document,
      );
    }

    return jobTemp.status === 'completed';
  }

  @OnQueueCompleted()
  async completeHandler(job: Job<ProcessMelvinAsrJob>, result: boolean) {
    if (result) {
      this.logger.verbose(
        `Fetching Result Completed for transcription: "${job.data.transcription._id.toString()}"`,
      );

      const systemUser = await this.authService.findSystemAuthUser();
      const updatedTranscription = await this.transcriptionService.findOne(
        systemUser,
        job.data.transcription._id.toString(),
      );
      const entity = plainToInstance(TranscriptionEntity, updatedTranscription);
      this.events.transcriptionUpdated(job.data.project, entity);
    } else {
      this.logger.verbose(
        `Fetching Process Unfinished for transcription: "${job.data.transcription._id.toString()}`,
      );
    }
  }

  @OnQueueFailed()
  async failHandler(job: Job<ProcessMelvinAsrJob>, err: Error) {
    this.logger.error(
      'Error in attempt ' + job.attemptsMade + '/' + job.opts.attempts,
    );
    this.logger.error('Fetching Result Failed', err);

    if (job.attemptsMade === job.opts.attempts) {
      this.logger.info(
        'Job failed after ' +
          job.attemptsMade +
          ' attempts, it will not repeat again. Transcription id: ' +
          job.data.transcription._id.toString(),
      );

      await this.db.transcriptionModel
        .findByIdAndUpdate(job.data.transcription._id, {
          $set: {
            status: TranscriptionStatus.ERROR,
          },
        })
        .lean()
        .exec();

      const systemUser = await this.authService.findSystemAuthUser();
      const updatedTranscription = await this.transcriptionService.findOne(
        systemUser,
        job.data.transcription._id.toString(),
      );
      const entity = plainToInstance(TranscriptionEntity, updatedTranscription);
      this.events.transcriptionUpdated(job.data.project, entity);
    }
  }

  _syncSpeaker(
    document: TiptapDocument,
    captionEntities: CaptionEntity[],
  ): TiptapDocument {
    const speakerIdsInCaptions = [
      ...new Set(captionEntities.map((caption) => caption.speakerId)),
    ];

    if (speakerIdsInCaptions.length === 1) {
      document.content.at(0).attrs.speakerId = speakerIdsInCaptions[0];
      return document;
    }

    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '')
        .trim();
    };

    const documentWords: { pargraphId: number; text: string }[] = [];
    document.content.forEach((paragraph, i) =>
      paragraph.content.forEach((node, nodeIndex) => {
        const previousWord = documentWords.at(-1);
        const text = normalize(node.text);
        if (text.length !== 0) {
          if (node.text.startsWith(' ') || nodeIndex === 0) {
            documentWords.push({ pargraphId: i, text });
          } else {
            previousWord.text += text;
          }
        }
      }),
    );

    const captionWords: { speaker: string; text: string }[] = [];
    captionEntities.forEach((caption) => {
      const splitted = caption.text
        .replace(/(\r\n|\n|\r|\t)/gm, ' ')
        .split(' ');
      splitted.forEach((word) => {
        const text = normalize(word);
        if (text.length !== 0) {
          captionWords.push({ speaker: caption.speakerId, text });
        }
      });
    });

    if (documentWords.length !== captionWords.length) {
      throw new Error('Document and caption length mismatch');
    }

    let previousSpeaker = undefined;
    captionWords.forEach((captionWord, index) => {
      if (captionWord.speaker !== previousSpeaker) {
        const paragraph = document.content[documentWords[index].pargraphId];
        if (
          paragraph.attrs.speakerId &&
          paragraph.attrs.speakerId !== captionWord.speaker
        ) {
          // dont set speaker if its already set? but also dont throw error?
          // throw new Error('Speaker already set');
        } else {
          paragraph.attrs.speakerId = captionWord.speaker;
          previousSpeaker = captionWord.speaker;
        }
      }
    });
    return document;
  }
}
