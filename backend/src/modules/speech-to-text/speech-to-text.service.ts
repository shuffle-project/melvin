import { Injectable } from '@nestjs/common';
import { AsrServiceConfig } from '../../app.interfaces';
import { AsrVendors } from '../../processors/processor.interfaces';
import { TranscriptionEntity } from '../../resources/transcription/entities/transcription.entity';
import { DbService } from '../db/db.service';
import { Audio, Project } from '../db/schemas/project.schema';
import { CustomLogger } from '../logger/logger.service';
import { MelvinAsrTranscript } from '../melvin-asr-api/melvin-asr-api.interfaces';
import { PathService } from '../path/path.service';
import { TiptapService } from '../tiptap/tiptap.service';
import { AssemblyAiService } from './assemblyai/assemblyai.service';
import { GoogleSpeechService } from './google-speech/google-speech.service';
import { TranscriptEntity, WordEntity } from './speech-to-text.interfaces';
import { WhisperSpeechService } from './whisper/whisper-speech.service';

@Injectable()
export class SpeechToTextService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private pathService: PathService,
    private assemblyAiService: AssemblyAiService,
    private googleSpeechService: GoogleSpeechService,
    private whisperSpeechService: WhisperSpeechService,
    private tiptapService: TiptapService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  private serviceConfigs: {
    assemblyAi: AsrServiceConfig | null;
    googleSpeech: AsrServiceConfig | null;
    whisper: AsrServiceConfig | null;
  } = {
    assemblyAi: null,
    googleSpeech: null,
    whisper: null,
  };

  async initServices() {
    const [
      assemblyAiLanguages,
      googleSpeechLangugages,
      whisperSpeechLanguages,
    ] = await Promise.all([
      this.assemblyAiService.fetchLanguages(),
      this.googleSpeechService.fetchLanguages(),
      this.whisperSpeechService.fetchLanguages(),
    ]);

    if (assemblyAiLanguages) {
      this.serviceConfigs.assemblyAi = {
        asrVendor: AsrVendors.ASSEMBLYAI,
        fullName: 'AssemblyAi',
        languages: assemblyAiLanguages,
      };
    }

    if (googleSpeechLangugages) {
      this.serviceConfigs.googleSpeech = {
        asrVendor: AsrVendors.GOOGLE,
        fullName: 'Google Speech-to-text',
        languages: googleSpeechLangugages,
      };
    }

    if (whisperSpeechLanguages) {
      this.serviceConfigs.whisper = {
        asrVendor: AsrVendors.WHISPER,
        fullName: 'Whisper AI',
        languages: whisperSpeechLanguages,
      };
    }
  }

  getConfig(): AsrServiceConfig[] {
    const asrServiceConfigs: AsrServiceConfig[] = [];

    if (this.serviceConfigs.assemblyAi) {
      asrServiceConfigs.push(this.serviceConfigs.assemblyAi);
    }

    if (this.serviceConfigs.googleSpeech) {
      asrServiceConfigs.push(this.serviceConfigs.googleSpeech);
    }

    if (this.serviceConfigs.whisper) {
      asrServiceConfigs.push(this.serviceConfigs.whisper);
    }

    return asrServiceConfigs;
  }

  async generate(
    project: Project,
    transcription: TranscriptionEntity,
    audio: Audio,
    vendor: AsrVendors,
  ) {
    this.logger.verbose(
      `Start - Generate captions for Project ${project._id} with asr vendor ${vendor}`,
    );

    let res: TranscriptEntity | string;
    switch (vendor) {
      case AsrVendors.ASSEMBLYAI:
        res = await this.assemblyAiService.run(project, audio);
        await this._saveToTiptap(res.words, transcription);
        break;
      case AsrVendors.GOOGLE:
        res = await this.googleSpeechService.run(project, audio);
        await this._saveToTiptap(res.words, transcription);
        break;
      case AsrVendors.WHISPER:
        await this.whisperSpeechService.run(project, audio, transcription);
        break;
      case AsrVendors.RANDOM:
        // TODO
        // cleanup noch benötigt?
        // captions = this.populateService._generateRandomCaptions(
        //   project,
        //   transcription,
        // );
        // captions = await this._vttFilePathToCaptions(
        //   res as string,
        //   transcription,
        //   project,
        // );
        break;
      default:
        // empty transcription
        break;
    }

    // else if (vendor === AsrVendors.WHISPER) {
    //   const whisperVtt = project._id.toString() + '.vtt';
    //   const vttFilePath = this.pathService.getWavFile(whisperVtt);
    // }

    this.logger.verbose(
      `Finished - Generate captions for Project ${project._id}`,
    );
  }

  private async _saveToTiptap(
    words: WordEntity[],
    transcription: TranscriptionEntity,
  ) {
    const document = this.tiptapService.wordsToTiptap(
      words,
      transcription.speakers[0]._id.toString(),
    );
    await this.tiptapService.updateDocument(
      transcription._id.toString(),
      document,
    );
  }

  async align(
    project: Project,
    transcription: TranscriptionEntity,
    audio: Audio,
    vendor: AsrVendors,
    transcriptToAlign: MelvinAsrTranscript,
  ) {
    this.logger.verbose(
      `Start - Generate aligning captions for Project ${project._id}/${transcription._id} with asr vendor ${vendor}`,
    );

    // remove all \n and \r
    // textToAlign = textToAlign.replace(/(\r\n|\n|\r|\t)/gm, ' ');

    // let captions: Caption[] = [];
    let res: TranscriptEntity;
    switch (vendor) {
      case AsrVendors.WHISPER:
        // res =
        await this.whisperSpeechService.runAlign(
          project,
          transcriptToAlign,
          audio,
          transcription,
        );

        break;

      // other vendors not implemented
      default:
        this.logger.info('empty transcription');
        // empty transcription
        break;
    }

    this.logger.verbose(
      `Finished - Aligning captions for Project ${project._id}/${transcription._id}`,
    );
  }
}
