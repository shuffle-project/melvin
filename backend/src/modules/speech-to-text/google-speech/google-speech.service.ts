import { ProjectsClient } from '@google-cloud/resource-manager';
import { SpeechClient } from '@google-cloud/speech';
import { Bucket, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MelvinAsrTranscript } from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { LanguageShort } from '../../../app.interfaces';
import { GoogleSpeechConfig } from '../../../config/config.interface';
import { ProjectEntity } from '../../../resources/project/entities/project.entity';
import { DbService } from '../../db/db.service';
import { Audio, Project } from '../../db/schemas/project.schema';
import { CustomLogger } from '../../logger/logger.service';
import { PathService } from '../../path/path.service';
import {
  ISpeechToTextService,
  TranscriptEntity,
  WordEntity,
} from '../speech-to-text.interfaces';
import { GOOGLE_LANGUAGES } from './languages.constants';

@Injectable()
export class GoogleSpeechService implements ISpeechToTextService {
  private googleSpeechConfig: GoogleSpeechConfig;
  private project_id: string;
  private client_email: string;
  private private_key: string;
  private bucketName: string;

  private storageClient: Storage;
  private bucket: Bucket;
  private speechClient: SpeechClient;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private configService: ConfigService,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);

    this.googleSpeechConfig =
      this.configService.get<GoogleSpeechConfig>('googleSpeech');

    this.project_id = this.googleSpeechConfig?.project_id;
    this.private_key = this.googleSpeechConfig?.private_key;
    this.client_email = this.googleSpeechConfig?.client_email;
    this.bucketName = this.googleSpeechConfig?.bucketName;
    // this.keyfile = this.googleSpeechConfig.keyfileContent;
  }
  runAlign(
    project: ProjectEntity,
    text: MelvinAsrTranscript,
    audio: Audio,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async fetchLanguages(): Promise<LanguageShort[] | null> {
    if (!this.googleSpeechConfig) {
      return null;
    }
    try {
      // init values
      const credentials = {
        client_email: this.client_email,
        private_key: this.private_key,
      };

      const projectsClient = new ProjectsClient({ credentials });

      // https://cloud.google.com/iam/docs/permissions-reference#search
      const permissions = [
        'storage.objects.get',
        'storage.objects.create',
        'storage.objects.delete',
        'speech.adaptations.execute',
      ];
      const resource = projectsClient.projectPath(this.project_id);

      const [response] = await projectsClient.testIamPermissions({
        resource,
        permissions,
      });

      if (response.permissions.length !== permissions.length) {
        return null;
      }

      this.storageClient = new Storage({ credentials });
      this.speechClient = new SpeechClient({ credentials });
      this.bucket = this.storageClient.bucket(this.bucketName);

      return GOOGLE_LANGUAGES;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async run(project: Project, audio: Audio): Promise<TranscriptEntity> {
    try {
      await this._uploadFileToBucket(project, audio);
      const response = await this._execSpeechToText(project, audio);

      // concat and reformat words from google format to our format
      const allWords: WordEntity[] = [];
      const results = response.results.map((result) => result.alternatives[0]);
      results.forEach((result) =>
        allWords.push(
          ...result.words.map((w) => ({
            text: w.word,
            start: +w.startTime.seconds * 1000,
            end: +w.endTime.seconds * 1000,
            startParagraph: false,
            speakerId: null,
          })),
        ),
      );

      return {
        words: allWords,
      };
    } catch (error) {
      console.log(error);
    } finally {
      this._deleteFilesInBucket(project);
    }

    return null;
  }

  async _uploadFileToBucket(project: Project, audio: Audio) {
    // const localAudioPath = this.pathService.getWavFile(project._id.toString());
    // const wav = project.audios.find((audio) => audio.extension === 'wav');
    const localAudioPath = this.pathService.getAudioFile(
      project._id.toString(),
      audio,
      false,
    );
    const destination = `${project._id.toString()}/audio.${audio.extension}`;

    await this.bucket.upload(localAudioPath, { destination });

    return;
  }

  async _deleteFilesInBucket(project: Project) {
    await this.bucket.deleteFiles({ prefix: `${project._id.toString()}` });
  }

  async _execSpeechToText(project: Project, audio: Audio) {
    const uri = `gs://${this.bucketName}/${project._id.toString()}/audio.${
      audio.extension
    }`;
    const encoding = 0;
    const sampleRateHertz = 48000;

    const [operation] = await this.speechClient.longRunningRecognize({
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: project.language,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        // enableWordConfidence: true,
        maxAlternatives: 1,
      },
      audio: { uri },
    });

    // Get a Promise representation of the final result of the job
    const [response] = await operation.promise();

    // await writeFile('./test.json', JSON.stringify(response.results));

    return response;

    // return response.results;
  }
}
