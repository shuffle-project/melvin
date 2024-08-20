import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import {
  AlignPayload,
  ProcessSubtitlesJob,
  SubtitlesType,
} from '../../processors/processor.interfaces';
import { PopulateService } from '../../resources/populate/populate.service';
import { generateSecureToken } from '../../utils/crypto';
import { DbService } from '../db/db.service';
import { CustomLogger } from '../logger/logger.service';
import { WhisperSpeechService } from '../speech-to-text/whisper/whisper-speech.service';
import { TiptapService } from '../tiptap/tiptap.service';
import { Transaction } from 'prosemirror-state';

@Injectable()
export class MigrationService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private populateService: PopulateService,
    private tiptapService: TiptapService,
    private whisper: WhisperSpeechService,
    @InjectQueue('subtitles')
    private subtitlesQueue: Queue<ProcessSubtitlesJob>,
  ) {
    this.logger.setContext('Migration');
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.info('Initialize migration check');
    let settings = await this.db.settingsModel.findOne({});

    this.logger.info('settings.dbSchemaVersion', settings.dbSchemaVersion);

    if (settings === null) {
      this.logger.info('First application start');
      settings = await this.db.settingsModel.create({ dbSchemaVersion: 1 });
      this.logger.info('Create example project');
      await this.populateService.populate([], 1);
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

    if (settings.dbSchemaVersion < 3) {
      this.logger.info('Migrate to version 3');
      await this._migrateToV3Tiptap();

      settings.dbSchemaVersion = 3;
      await settings.save();
      this.logger.info('Migration to version 3 successful');
    }
  }

  private async _migrateToV3Tiptap() {
    const transcriptions = await this.db.transcriptionModel.find({});
    for (const transcription of transcriptions) {
      const captions = await this.db.captionModel.find({
        transcription: transcription._id,
      });

      if (
        captions.length > 0 &&
        (transcription.ydoc === undefined || transcription.ydoc === null)
      ) {
        const project = await this.db.projectModel
          .findById(transcription.project)
          .exec();

        const text = captions
          .map((caption) => {
            return caption.text;
          })
          .join(' ');

        /**
         *
         */

        this.logger.info(
          'Add align job to queue for transcription ' +
            transcription._id.toString(),
        );
        const payload: AlignPayload = {
          type: SubtitlesType.ALIGN,
          audio: project.audios[0],
          transcriptionId: transcription._id.toString(),
          text,
          syncSpeaker: captions,
        };
        this.subtitlesQueue.add({
          project: project,
          transcription: transcription,
          payload,
        });
      }
    }
  }
}
