import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from '@plussub/srt-vtt-parser';
import { readFile } from 'fs/promises';
import { AsrServiceConfig } from '../../app.interfaces';
import { AsrVendors } from '../../processors/processor.interfaces';
import { CaptionEntity } from '../../resources/caption/entities/caption.entity';
import { PopulateService } from '../../resources/populate/populate.service';
import { ProjectEntity } from '../../resources/project/entities/project.entity';
import { TranscriptionEntity } from '../../resources/transcription/entities/transcription.entity';
import { DbService } from '../db/db.service';
import { Caption } from '../db/schemas/caption.schema';
import { Audio, Project } from '../db/schemas/project.schema';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';
import { AssemblyAiService } from './assemblyai/assemblyai.service';
import { GoogleSpeechService } from './google-speech/google-speech.service';
import { TranscriptEntity } from './speech-to-text.interfaces';
import { WhisperSpeechService } from './whisper/whisper-speech.service';

@Injectable()
export class SpeechToTextService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private pathService: PathService,
    private populateService: PopulateService,
    private assemblyAiService: AssemblyAiService,
    private googleSpeechService: GoogleSpeechService,
    private whisperSpeechService: WhisperSpeechService,
    private configService: ConfigService,
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

    //  only for random populate
    // asrServiceConfigs.push({
    //   asrVendor: AsrVendors.RANDOM,
    //   fullName: 'Random texts',
    //   languages: ASR_TEST_LANGUGAGE,
    // });

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

    let captions: Caption[] = [];
    let res: TranscriptEntity | string;
    switch (vendor) {
      case AsrVendors.ASSEMBLYAI:
        res = await this.assemblyAiService.run(project, audio);
        captions = this._wordsToCaptions(project, transcription, res);
        break;
      case AsrVendors.GOOGLE:
        res = await this.googleSpeechService.run(project, audio);
        captions = this._wordsToCaptions(project, transcription, res);
        break;
      case AsrVendors.WHISPER:
        res = await this.whisperSpeechService.run(project, audio);
        captions = this._wordsToCaptions(project, transcription, res);
        break;
      case AsrVendors.RANDOM:
        captions = this.populateService._generateRandomCaptions(
          project,
          transcription,
        );
        captions = await this._vttFilePathToCaptions(
          res as string,
          transcription,
          project,
        );
        break;
      default:
        // empty transcription
        break;
    }

    // else if (vendor === AsrVendors.WHISPER) {
    //   const whisperVtt = project._id.toString() + '.vtt';
    //   const vttFilePath = this.pathService.getWavFile(whisperVtt);
    // }

    await this.db.captionModel.insertMany(captions);
    this.logger.verbose(
      `Finished - Generate captions for Project ${project._id}`,
    );
  }

  private async _vttFilePathToCaptions(
    res: string,
    transcription: TranscriptionEntity,
    project: ProjectEntity,
  ) {
    const fileContent = await readFile(res as string);
    const readFileString = fileContent.toString();
    const { entries } = parse(readFileString);

    const tempCaptions: Caption[] = [];
    entries.forEach(({ from, to, text }) => {
      tempCaptions.push(
        new this.db.captionModel({
          start: from,
          end: to,
          speakerId: transcription.speakers[0]._id.toString(),
          text,
          initialText: text,
          transcription: transcription._id,
          project: project._id,
        }),
      );
    });
    return tempCaptions;
  }

  // TODO refactor/rewrite
  _wordsToCaptions(
    project: ProjectEntity,
    transcription: TranscriptionEntity,
    serviceResponseEntity: TranscriptEntity,
  ): CaptionEntity[] {
    const captions: CaptionEntity[] = [];
    let text = '';
    let lastStart = 0;
    serviceResponseEntity.words.forEach((word) => {
      if (lastStart + 5000 > word.startMs) {
        text = text + ' ' + word.word;
      } else {
        captions.push(
          new this.db.captionModel({
            start: lastStart,
            end: word.startMs,
            speakerId: transcription.speakers[0]._id.toString(),
            text,
            initialText: text,
            transcription: transcription._id,
            project: project._id,
          }),
        );
        lastStart = word.startMs;
        text = word.word + '';
      }
    });

    const lastWord =
      serviceResponseEntity.words[serviceResponseEntity.words.length - 1];
    captions.push(
      new this.db.captionModel({
        start: lastStart,
        end: lastWord.endMs,
        speakerId: transcription.speakers[0]._id.toString(),
        text,
        initialText: text,
        transcription: transcription._id,
        project: project._id,
      }),
    );

    return captions;
  }
}
