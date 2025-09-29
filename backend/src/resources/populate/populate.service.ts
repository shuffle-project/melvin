import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from '@plussub/srt-vtt-parser';
import { Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import dayjs from 'dayjs';
import { emptyDir, ensureDir, readFile, symlink } from 'fs-extra';
import { copyFile, readdir } from 'fs/promises';
import { Types } from 'mongoose';
import { basename, join } from 'path';
import { Caption } from 'src/modules/db/schemas/caption.schema';
import { WordEntity } from 'src/modules/speech-to-text/speech-to-text.interfaces';
import { WhiTranscriptEntity } from 'src/modules/speech-to-text/whisper/whisper.interfaces';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { EmailConfig, Environment } from '../../config/config.interface';
import {
  EXAMPLE_CAPTION,
  EXAMPLE_PROJECT,
  EXAMPLE_TRANSCRIPTION,
  EXAMPLE_USER,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { Activity } from '../../modules/db/schemas/activity.schema';
import { Notification } from '../../modules/db/schemas/notification.schema';
import {
  Project,
  ProjectStatus,
} from '../../modules/db/schemas/project.schema';
import { Transcription } from '../../modules/db/schemas/transcription.schema';
import { User } from '../../modules/db/schemas/user.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { PathService } from '../../modules/path/path.service';
import {
  ProcessProjectJob,
  ProcessSubtitlesJob,
} from '../../processors/processor.interfaces';
import { generateSecureToken } from '../../utils/crypto';
import { isSameObjectId } from '../../utils/objectid';
import { CreateActivityDto } from '../activity/dto/create-activity.dto';
import { ProjectEntity } from '../project/entities/project.entity';
import { UserRole } from '../user/user.interfaces';
import { Person } from './populate.interfaces';
import { CAPTION_TEXTS, LANGUAGES, TITLES } from './random-data.constants';

const MAX_TRANSCRIPTIONS_PER_PROJECT = 3;
const MIN_PROJECT_DURATION_IN_SECONDS = 20;
const MAX_PROJECT_DURATION_IN_SECONDS = 500;

const SPEAKER_NAMES: string[] = [];

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
    // const initialUsers = this.configService.get<PopulateUser[]>('initialUsers');
    // if (SPEAKER_NAMES.length < 1) {
    //   SPEAKER_NAMES.push(...initialUsers.map((x) => x.name));
    // }
  }

  _shuffle<T>(array: T[]): T[] {
    return array.slice().sort(() => Math.random() - 0.5);
  }

  _random(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async _clearDatabase(): Promise<void> {
    await this.projectQueue.clean(1000);
    await this.subtitlesQueue.clean(1000);

    // Clear all collections
    await Promise.all([
      this.db.userModel.deleteMany({}),
      this.db.projectModel.deleteMany({}),
      this.db.captionModel.deleteMany({}),
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

  _generateUsers(persons: Person[]): User[] {
    return [
      new this.db.userModel({ ...EXAMPLE_USER, projects: [] }),
      ...new Array(persons.length).fill(null).map((o, i) => {
        const { name, email } = persons[i];

        return new this.db.userModel({
          ...EXAMPLE_USER,
          _id: new Types.ObjectId(),
          name,
          email,
          role: UserRole.USER,
        });
      }),
    ];
  }

  _generateProjects(numProjects: number, users: User[]): Project[] {
    return new Array(numProjects).fill(null).map((o, i) => {
      if (i === 0) {
        return new this.db.projectModel({
          ...EXAMPLE_PROJECT,
          users: users.map((o) => o._id),
          createdBy: users[0]._id,
          status: ProjectStatus.DRAFT,
          inviteToken: generateSecureToken(),
          viewerToken: generateSecureToken(),
        });
      } else {
        const isOldProject = i > Object.keys(ProjectStatus).length;

        const members = isOldProject
          ? this._shuffle(users)
              .slice(0, this._random(1, 3))
              .map((o) => o._id)
          : users.map((o) => o._id);

        const duration = Math.floor(
          this._random(
            MIN_PROJECT_DURATION_IN_SECONDS * 1000,
            MAX_PROJECT_DURATION_IN_SECONDS * 1000,
          ),
        );

        const status = isOldProject
          ? ProjectStatus.FINISHED
          : Object.values(ProjectStatus)[i - 1];

        const date = dayjs()
          .subtract(
            isOldProject ? this._random(500, 1000) : this._random(0, 500),
            'days',
          )
          .toDate();

        return new this.db.projectModel({
          ...EXAMPLE_PROJECT,
          _id: new Types.ObjectId(),
          users: members,
          createdBy: members[0],
          duration,
          status,
          createdAt: date,
          updatedAt: date,
          title: TITLES[this._random(0, TITLES.length - 1)],
          start: 0,
          end: duration,
          language: LANGUAGES[this._random(0, LANGUAGES.length - 1)],
          inviteToken: generateSecureToken(),
          viewerToken: generateSecureToken(),
        });
      }
    });
  }

  _generateTranscriptions(
    project: Project,
    maxTranscriptionsPerProject?: number,
  ): Transcription[] {
    return new Array(
      this._random(
        1,
        maxTranscriptionsPerProject ?? MAX_TRANSCRIPTIONS_PER_PROJECT,
      ),
    )
      .fill(null)
      .map((o, i) => {
        const value =
          i === 0 && isSameObjectId(project._id, EXAMPLE_PROJECT._id)
            ? EXAMPLE_TRANSCRIPTION._id
            : undefined;
        const _id = new Types.ObjectId(value);

        const speakers = this._shuffle(SPEAKER_NAMES)
          .slice(0, this._random(2, 4))
          .map((name) => ({
            _id: new Types.ObjectId(),
            name,
          }));

        const language =
          i === 0
            ? project.language
            : LANGUAGES[this._random(0, LANGUAGES.length - 1)];

        return new this.db.transcriptionModel({
          ...EXAMPLE_TRANSCRIPTION,
          _id,
          createdBy: project.createdBy,
          project: project._id,
          speakers,
          language,
          title: `${language} Untertitel`,
        });
      });
  }

  async _generateDefaultCaptions(
    project: Project,
    transcription: Transcription,
  ): Promise<Caption[]> {
    const content = await readFile(
      join(
        this.pathService.getAssetsDirectory(),
        'subtitles',
        'erklaervideoUDL_De.vtt',
      ),
      'utf-8',
    );
    const { entries } = parse(content);

    return entries.map(
      (o) =>
        new this.db.captionModel({
          initialText: o.text,
          text: o.text,
          start: o.from,
          end: o.to,
          speakerId: transcription.speakers[0]._id,
          transcription: transcription._id,
          project: project._id,
        }),
    );
  }

  _generateRandomCaptions(
    project: Project,
    transcription: Transcription,
  ): Caption[] {
    const captions: Caption[] = [];

    let start = 0;
    while (start < project.duration) {
      const text = CAPTION_TEXTS[this._random(0, CAPTION_TEXTS.length - 1)];
      const speaker =
        transcription.speakers[
          this._random(0, transcription.speakers.length - 1)
        ];
      const end = Math.min(
        project.duration,
        this._random(start + 1000, start + 8000),
      );

      captions.push(
        new this.db.captionModel({
          ...EXAMPLE_CAPTION,
          _id: new Types.ObjectId(),
          project: project._id,
          transcription: transcription._id,
          text,
          initialText: text,
          speakerId: speaker._id,
          start,
          end,
        }),
      );

      start = end;
    }
    return captions;
  }

  _generateActivities(systemUser: User, project: Project): Activity[] {
    const dtos: CreateActivityDto[] = [
      {
        createdBy: project.createdBy,
        project: project._id,
        action: 'project-created',
        details: {},
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'video-processing-finished',
        details: {},
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'project-status-updated',
        details: {
          before: ProjectStatus.PROCESSING,
          after: ProjectStatus.DRAFT,
        },
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'project-title-updated',
        details: {
          before: `old_${project.title}`,
          after: project.title,
        },
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'project-user-joined',
        details: { user: systemUser },
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'project-user-left',
        details: { user: systemUser },
      },
      {
        createdBy: systemUser._id,
        project: project._id,
        action: 'subtitles-processing-failed',
        details: {
          error: { name: 'processing_failed', message: 'processing failed' },
        },
      },
    ];

    return dtos.map((o) => new this.db.activityModel(o));
  }

  _generateNotifications(
    projects: Project[],
    activities: Activity[],
  ): Notification[] {
    const notifications: Notification[] = [];

    for (const activity of activities) {
      const project = projects.find((o) =>
        isSameObjectId(o._id, activity.project),
      );

      const users = project.users.filter(
        (o) => !isSameObjectId(o, activity.createdBy),
      );

      notifications.push(
        ...users.map((user) => {
          return new this.db.notificationModel({
            user,
            activity: activity._id,
          });
        }),
      );
    }

    return notifications;
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

  async populate(persons: Person[], numProjects: number): Promise<any> {
    this.logger.verbose('Clear database and queues');
    await this._clearDatabase();
    this.logger.verbose('Database cleared');

    // Users
    this.logger.verbose('Generate users');
    const systemUser = this._generateSystemUser();
    const users = this._generateUsers(persons);

    // Projects
    this.logger.verbose('Generate projects');
    const projects = this._generateProjects(numProjects, users);
    // Add project references to users
    for (const project of projects) {
      for (const userId of project.users as Types.ObjectId[]) {
        const user = users.find((o) => isSameObjectId(o._id, userId));
        user.projects.push(project._id);
      }
    }

    // Transcriptions
    this.logger.verbose('Generate transcriptions');
    const transcriptions: Transcription[] = [];
    for (const project of projects) {
      const projectTranscriptions = this._generateTranscriptions(project);
      transcriptions.push(...projectTranscriptions);

      // Add transcription references to project
      project.transcriptions = projectTranscriptions.map((o) => o._id);
    }

    // // Captions
    // this.logger.verbose('Generate captions');
    // const captions: Caption[] = [];
    // for (let i = 0; i < transcriptions.length; i++) {
    //   const transcription = transcriptions[i];
    //   const project = projects.find((o) =>
    //     isSameObjectId(o._id, transcription.project._id),
    //   );
    //   this.logger.verbose(
    //     `Generate captions for transcription (${i + 1} / ${
    //       transcriptions.length
    //     })`,
    //   );

    //   const transcriptionCaptions =
    //     i === 0
    //       ? await this._generateDefaultCaptions(project, transcription)
    //       : this._generateRandomCaptions(project, transcription);

    //   captions.push(...transcriptionCaptions);
    // }

    // Activities
    const activities: Activity[] = [];
    for (const project of projects) {
      const projectActivities = this._generateActivities(systemUser, project);
      activities.push(...projectActivities);
    }

    // Notifications
    const notifications = this._generateNotifications(projects, activities);

    // Bulk insert data
    this.logger.verbose(
      'Insert generated data into the database (this may take some time)',
    );
    await Promise.all([
      this.db.userModel.insertMany([systemUser, ...users]),
      this.db.projectModel.insertMany(projects),
      this.db.transcriptionModel.insertMany(transcriptions),
      // this.db.captionModel.insertMany(captions),
      this.db.activityModel.insertMany(activities),
      this.db.notificationModel.insertMany(notifications),
    ]);
    this.logger.verbose('Data inserted into database.');

    // Create media files
    this.logger.verbose('Copy example files and create symlinks');
    await this._clearMediaDirectory();
    await this._copyMediaFiles(projects);

    this.logger.verbose('Populate finished');
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
