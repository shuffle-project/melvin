import { Injectable } from '@nestjs/common';
import { PopulateService } from '../../resources/populate/populate.service';
import { generateSecureToken } from '../../utils/crypto';
import { DbService } from '../db/db.service';
import { CustomLogger } from '../logger/logger.service';
import { WordEntity } from '../speech-to-text/speech-to-text.interfaces';
import { WhisperSpeechService } from '../speech-to-text/whisper/whisper-speech.service';
import { TiptapService } from '../tiptap/tiptap.service';

@Injectable()
export class MigrationService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private populateService: PopulateService,
    private tiptapService: TiptapService,
    private whisper: WhisperSpeechService,
  ) {
    this.logger.setContext('Migration');
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.info('Initialize migration check');
    let settings = await this.db.settingsModel.findOne({});

    this.logger.info('settings', settings);

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
    }

    this.logger.info('settings', settings);

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
      this.logger.info('Migration successful');
    }

    if (settings.dbSchemaVersion < 4) {
      this.logger.info(
        'Migrate to version 3 -> Move from CaptionEntity to Tiptap',
      );
      await this._migrateToV3Tiptap();
      settings.dbSchemaVersion = 3;
      await settings.save();
    }
  }

  private async _migrateToV3Tiptap() {
    const transcriptions = await this.db.transcriptionModel.find({});
    for (const transcription of transcriptions) {
      const captions = await this.db.captionModel.find({
        transcription: transcription._id,
      });
      const words: WordEntity[] = [];

      captions.forEach((caption) => {
        const textSplitted = caption.text.split(' ');
        const wordsInCaption: WordEntity[] = textSplitted.map(
          (split, index) => {
            return {
              text: index === 0 ? split : ' ' + split,
              start: caption.start,
              end: caption.end,
              speakerId: caption.speakerId.toString(),
              startParagraph: index === 0,
            };
          },
        );
        words.push(...wordsInCaption.filter((word) => word.text.length > 0));
      });

      if (words.length > 0 && transcription._id === transcriptions[0]._id) {
        try {
          const text = captions.map((caption) => caption.text).join(' ');
          console.log(text);
          const project = await this.db.projectModel
            .findById(transcription.project)
            .exec();

          console.log('run align');
          const alinedWords = await this.whisper.runAlign(
            project,
            text,
            'en',
            project.audios[0],
          );

          const tiptapDocument = this.tiptapService.wordsToTiptap(
            alinedWords.words,
          );

          transcription.ydoc = undefined;
          await transcription.save();
          console.log('ydoc set to null');

          // update document with tiptapdocument
          await this.tiptapService.updateDocument(
            transcription._id.toString(),
            tiptapDocument,
          );
          console.log('ydoc updated');
        } catch (e) {
          console.log(e);
        }
      }

      // TODO run ts whisper to sync word timestamps
    }
  }
}
