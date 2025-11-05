import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { emptyDir, ensureDir, readFile, symlink } from 'fs-extra';
import { copyFile, readdir } from 'fs/promises';
import { Types } from 'mongoose';
import { basename, join } from 'path';
import { WordEntity } from 'src/modules/speech-to-text/speech-to-text.interfaces';
import { WhiTranscriptEntity } from 'src/modules/speech-to-text/whisper/whisper.interfaces';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { EmailConfig, Environment } from '../../config/config.interface';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_TRANSCRIPTION,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { Project } from '../../modules/db/schemas/project.schema';
import { User } from '../../modules/db/schemas/user.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { PathService } from '../../modules/path/path.service';
import {
  ProcessProjectJob,
  ProcessSubtitlesJob,
} from '../../processors/processor.interfaces';
import { generateSecureToken } from '../../utils/crypto';
import { ProjectEntity } from '../project/entities/project.entity';
import { UserRole } from '../user/user.interfaces';

@Injectable()
export class PopulateService {
  constructor(
    private db: DbService,
    private logger: CustomLogger,
    private pathService: PathService,
    private configService: ConfigService,
    @InjectQueue('subtitles')
    private subtitlesQueue: Queue<ProcessSubtitlesJob>,
    @InjectQueue('project') private projectQueue: Queue<ProcessProjectJob>,
    private tiptapService: TiptapService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async _clearDatabase(): Promise<void> {
    await this.projectQueue.clean(1000);
    await this.subtitlesQueue.clean(1000);

    // Clear all collections
    await Promise.all([
      this.db.userModel.deleteMany({}),
      this.db.projectModel.deleteMany({}),
      this.db.exportModel.deleteMany({}),
      this.db.transcriptionModel.deleteMany({}),
      this.db.activityModel.deleteMany({}),
      this.db.notificationModel.deleteMany({}),
    ]);
  }

  _generateSystemUser(): User {
    const { mailFrom } = this.configService.get<EmailConfig>('email');
    return new this.db.userModel({
      _id: new Types.ObjectId(),
      name: 'System',
      email: mailFrom,
      role: UserRole.SYSTEM,
    });
  }

  async _clearMediaDirectory(): Promise<void> {
    await emptyDir(join('media', 'projects'));
  }

  async _copyMediaFiles(projects: Project[]): Promise<void> {
    // Get filepaths of example files
    const exampleProjectDirectory =
      this.pathService.getExampleProjectDirectory();
    const filenames = await readdir(exampleProjectDirectory);
    const filteredFilenames = filenames.filter(
      (file) => !file.startsWith('old'),
    );
    const filepaths = filteredFilenames.map((o) =>
      join(exampleProjectDirectory, o),
    );

    // Generate project directory and symlink paths
    const directories: string[] = [];
    const files: Array<{ src: string; dst: string }> = [];

    for (const project of projects) {
      const video = project.videos[0];
      const audio = project.audios[0];

      const projectDirectory = this.pathService.getProjectDirectory(
        project._id.toString(),
      );
      directories.push(projectDirectory);

      files.push(
        ...filepaths.map((src) => {
          let name = basename(src);
          if (name.startsWith('video')) {
            name = name.replace('video', video._id.toString());
          } else if (name.startsWith('audio')) {
            name = name.replace('audio', audio._id.toString());
          } else if (name === 'waveform.json') {
            name = audio._id.toString() + '.json';
          }

          return {
            src,
            dst: join(projectDirectory, name),
          };
        }),
      );
    }

    // Create project media directories
    await Promise.all(directories.map((o) => ensureDir(o)));

    // Create symlinks -> auf windows muss der enwicklermodus aktiv sein
    if (this.configService.get('environment') !== Environment.DOCKER) {
      this.logger.info('Create symlinks for default projects');
      await Promise.all(files.map((o) => symlink(o.src, o.dst, 'file')));
    } else {
      this.logger.info('Copy files for default projects');
      for (const file of files) {
        await copyFile(file.src, file.dst);
      }
    }
  }

  async _generateDefaultProject(userId: string) {
    const projectId = new Types.ObjectId();
    const transcriptionId = new Types.ObjectId();

    // create project
    const project = new this.db.projectModel({
      ...EXAMPLE_PROJECT,
      _id: projectId,
      users: [userId],
      createdBy: userId,
      transcriptions: [transcriptionId],
      inviteToken: generateSecureToken(),
      viewerToken: generateSecureToken(),
    });

    // add project to user
    await this.db.userModel.findByIdAndUpdate(userId, {
      $push: { projects: projectId },
    });

    const speaker1Id = new Types.ObjectId();
    // transcription
    const transcription = new this.db.transcriptionModel({
      ...EXAMPLE_TRANSCRIPTION,
      _id: transcriptionId,
      createdBy: userId,
      project: projectId,
      speakers: [
        {
          _id: speaker1Id,
          name: 'Sprecherin 1',
        },
      ],
    });

    // // captions
    // const captions = await this._generateDefaultCaptions(
    //   project,
    //   transcription,
    // );

    await Promise.all([
      this.db.projectModel.insertMany([project]),
      this.db.transcriptionModel.insertMany([transcription]),
      // this.db.captionModel.insertMany(captions),
      // this.db.activityModel.insertMany(activities),
      // this.db.notificationModel.insertMany(notifications),
    ]);

    const content = await readFile(
      join(
        this.pathService.getAssetsDirectory(),
        'subtitles',
        'erklaervideoUDL_De_words.json',
      ),
      'utf-8',
    );

    // const { entries } = parse(content);
    const whi: WhiTranscriptEntity = JSON.parse(content);

    const words: WordEntity[] = [];

    let lastSegmentEnd = 0;
    whi.transcript.segments.forEach((segment) => {
      const secondsToLastSegment = segment.start - lastSegmentEnd;

      lastSegmentEnd = segment.end;

      segment.words.forEach((word, i) => {
        if (word.text.length > 0) {
          const startParagraph = i === 0 && secondsToLastSegment > 3;
          words.push({
            text: word.text,
            start: word.start * 1000,
            end: word.end * 1000,
            confidence: word.probability,
            startParagraph,
            speakerId: null,
          });
        }
      });
    });
    const doc = this.tiptapService.wordsToTiptap(words, speaker1Id.toString());

    await this.tiptapService.updateDocument(transcription._id.toString(), doc);

    await this._copyMediaFiles([project]);

    const finalProject = await this.db.findProjectByIdOrThrow(projectId);
    const entity = plainToInstance(ProjectEntity, {
      ...finalProject,
    }) as unknown as ProjectEntity;

    return entity;
  }
}
