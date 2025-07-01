import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import {
  MelvinAsrAlignByAudioDto,
  MelvinAsrTranscript,
} from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { ProcessMelvinAsrJob } from 'src/processors/melvin-asr.processor';
import { CaptionEntity } from 'src/resources/caption/entities/caption.entity';
import { TranscriptionEntity } from 'src/resources/transcription/entities/transcription.entity';
import { LanguageShort } from '../../../app.interfaces';
import { WhisperConfig } from '../../../config/config.interface';
import { DbService } from '../../db/db.service';
import { Audio, Project } from '../../db/schemas/project.schema';
import { CustomLogger } from '../../logger/logger.service';
import { PathService } from '../../path/path.service';
import { ISpeechToTextService } from '../speech-to-text.interfaces';

// npm rebuild bcrypt --build-from-source

@Injectable()
export class WhisperSpeechService implements ISpeechToTextService {
  private whisperConfig: WhisperConfig;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private db: DbService,
    private configService: ConfigService,
    private melvinAsrApiService: MelvinAsrApiService,
    @InjectQueue('melvinAsr')
    private melvinAsrQueue: Queue<ProcessMelvinAsrJob>,
  ) {
    this.logger.setContext(this.constructor.name);

    this.whisperConfig = this.configService.get<WhisperConfig>('whisper');
  }

  async fetchLanguages(): Promise<LanguageShort[]> {
    if (!this.whisperConfig) {
      return null;
    }
    try {
      const settings = await this.melvinAsrApiService.getSettings();

      return settings.transcription_languages.map((lang) => ({
        code: lang,
        name: lang,
      }));
    } catch (error) {
      this.logger.info('Could not fetch languages from whisper ');
      this.logger.info(error);
      return null;
    }
  }

  async run(
    project: Project,
    audio: Audio,
    transcription: TranscriptionEntity,
  ) {
    const uploaded = await this.melvinAsrApiService.upload(project, audio);

    const started = await this.melvinAsrApiService.runTranscription({
      audio_filename: uploaded.filename,
      language: this._getLanguage(project.language),
    });

    // Every and jobId need to be identical to the .removeRepeatable options
    await this.melvinAsrQueue.add(
      'fetchResult',
      { id: started.id, transcription, project, paragraphsViaTime: true },
      { repeat: { every: 10000 }, jobId: started.id },
    );
  }

  async runAlign(
    project: Project,
    melvinAsrTranscript: MelvinAsrTranscript,
    audio: Audio,
    transcription: TranscriptionEntity,
    syncSpeaker?: CaptionEntity[],
  ) {
    const uploaded = await this.melvinAsrApiService.upload(project, audio);

    const language = this._getLanguage(project.language);
    const dto: MelvinAsrAlignByAudioDto = {
      method: 'by_audio',
      transcript: melvinAsrTranscript,
      language,
      audio_filename: uploaded.filename,
    };
    const started = await this.melvinAsrApiService.runAlignment(dto);

    // Every and jobId need to be identical to the .removeRepeatable options
    await this.melvinAsrQueue.add(
      'fetchResult',
      {
        id: started.id,
        transcription,
        syncSpeaker,
        project,
        paragraphsViaTime: true,
      },
      { repeat: { every: 10000 }, jobId: started.id },
    );
  }

  private _getLanguage(languageString: string) {
    return languageString.includes('-')
      ? languageString.split('-')[0]
      : languageString;
  }
}
