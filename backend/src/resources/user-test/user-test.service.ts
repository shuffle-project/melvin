import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import { ensureDir, readdir, readFile, symlink } from 'fs-extra';
import { chunk } from 'lodash';
import { Types } from 'mongoose';
import { basename, join } from 'path';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_TRANSCRIPTION,
  EXAMPLE_USER,
} from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { Caption } from '../../modules/db/schemas/caption.schema';
import {
  Project,
  ProjectStatus,
} from '../../modules/db/schemas/project.schema';
import { Transcription } from '../../modules/db/schemas/transcription.schema';
import { LeanUserDocument, User } from '../../modules/db/schemas/user.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { PathService } from '../../modules/path/path.service';
import { CustomBadRequestException } from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthService } from '../auth/auth.service';
import { CaptionEntity } from '../caption/entities/caption.entity';
import { EventsGateway } from '../events/events.gateway';
import { PopulateService } from '../populate/populate.service';

import { parse } from '@plussub/srt-vtt-parser';

import { Entry } from '@plussub/srt-vtt-parser/dist/src/types';
import { ProjectService } from '../project/project.service';

const SHORTS = [
  'apeg',
  'bici',
  'cofu',
  'deno',
  'eket',
  'foro',
  'giro',
  'hisi',
  'ipox',
  'kezo',
  'loti',
  'meke',
  'nimi',
  'ofeg',
  'pode',
  'rume',
  'sohi',
  'tuvo',
  'uhoc',
  'vusi',
  'woko',
  'xigi',
  'zene',
  'agom',
  'bimu',
  'cuve',
  'dome',
  'efiz',
  'feku',
  'gevu',
  // 'hove',
  // 'igex',
  // 'kifu',
  // 'logo',
  // 'migu',
  // 'neho',
  // 'ozin',
  // 'pite',
  // 'rize',
  // 'sutu',
  // 'tuni',
  // 'udip',
  // 'vofo',
  // 'wupi',
  // 'xori',
  // 'zupo',
];
@Injectable()
export class UserTestService {
  private captionJobs: { [key: string]: NodeJS.Timeout[] } = {};

  constructor(
    private db: DbService,
    private logger: CustomLogger,
    private populateService: PopulateService,
    private pathService: PathService,
    private events: EventsGateway,
    private authService: AuthService,
    private projectService: ProjectService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  _generateUsers(): User[] {
    return SHORTS.map((short) => {
      return new this.db.userModel({
        ...EXAMPLE_USER,
        _id: new Types.ObjectId(),
        name: `${short}`,
        email: `${short.toLowerCase()}@hdm-stuttgart.de`,
        projects: [],
      });
    });
  }

  _generateProjects(admin: User, users: User[]): Project[] {
    const groups = chunk(users, 3);

    const duration = 743318;

    return groups.map((group, i) => {
      return new this.db.projectModel({
        ...EXAMPLE_PROJECT,
        _id: new Types.ObjectId(),
        users: [admin._id, ...group.map((o) => o._id)],
        createdBy: admin,
        duration,
        status: ProjectStatus.LIVE,
        // status: ProjectStatus.PAUSED,
        title: `Group ${i + 1}`,
        start: 0,
        end: duration,
        language: 'de-DE',
        inviteToken: randomBytes(64).toString('base64url'),
      });
    });
  }

  _generateTranscription(project: Project): Transcription {
    return new this.db.transcriptionModel({
      ...EXAMPLE_TRANSCRIPTION,
      _id: new Types.ObjectId(),
      createdBy: project.createdBy,
      project: project._id,
      speakers: [
        {
          _id: new Types.ObjectId(),
          name: 'Gottfried Zimmermann',
        },
      ],
      language: 'de-DE',
      title: `Deutsche Untertitel`,
    });
  }

  async _getCaptions(
    projectId: Types.ObjectId,
    transcription: Transcription,
    systemUserId: string | Types.ObjectId,
  ): Promise<Caption[]> {
    const content = await readFile(
      join(this.pathService.getAssetsDirectory(), 'user-test', 'subtitles.vtt'),
      'utf-8',
    );

    const { entries } = parse(content);

    return entries.map((entry: Entry) => ({
      project: projectId,
      transcription: transcription._id,
      updatedBy: systemUserId,
      speakerId: transcription.speakers[0]._id,
      initialText: entry.text,
      text: entry.text,
      start: entry.from,
      end: entry.to,
      wasManuallyEdited: false,
      lockedBy: null,
    })) as any;
  }

  async _copyMediaFiles(projects: Project[]): Promise<void> {
    // Get filepaths of example files
    const exampleProjectDirectory = join(
      this.pathService.getAssetsDirectory(),
      'user-test',
    );
    const filenames = await readdir(exampleProjectDirectory);
    const filepaths = filenames.map((o) => join(exampleProjectDirectory, o));

    // Generate project directory and symlink paths
    const directories: string[] = [];
    const symlinks: Array<{ target: string; path: string }> = [];

    for (const project of projects) {
      const projectDirectory = this.pathService.getProjectDirectory(
        project._id.toString(),
      );
      directories.push(projectDirectory);

      symlinks.push(
        ...filepaths.map((target) => ({
          target,
          path: join(projectDirectory, basename(target)),
        })),
      );
    }

    // Create project media directories
    await Promise.all(directories.map((o) => ensureDir(o)));

    // Create symlinks -> auf windows muss der enwicklermodus aktiv sein
    await Promise.all(symlinks.map((o) => symlink(o.target, o.path, 'file')));
  }

  async populate(): Promise<void> {
    this.logger.verbose('Clear database');
    await this.populateService._clearDatabase();
    this.logger.verbose('Database cleared');

    // Users
    this.logger.verbose('Generate users');
    const systemUser = this.populateService._generateSystemUser();
    const users = this._generateUsers();
    const admin = new this.db.userModel({
      ...EXAMPLE_USER,
      _id: new Types.ObjectId(),
      name: `Melvin`,
      email: `melvin@hdm-stuttgart.de`,
      projects: [],
    });

    // Projects
    this.logger.verbose('Generate projects');
    const projects = this._generateProjects(admin, users);
    // Add project references to users
    for (const project of projects) {
      for (const userId of project.users as Types.ObjectId[]) {
        const user = [admin, ...users].find((o) =>
          isSameObjectId(o._id, userId),
        );
        user.projects.push(project._id);
      }
    }

    // Transcriptions
    this.logger.verbose('Generate transcriptions');
    const transcriptions: Transcription[] = [];
    for (const project of projects) {
      const transcription = this._generateTranscription(project);
      transcriptions.push(transcription);

      // Add transcription references to project
      project.transcriptions = [transcription];
    }

    // Temp: Captions
    const captions: Caption[] = [];
    // for (let i = 0; i < projects.length; i++) {
    //   const project = projects[i];
    //   const transcription = transcriptions[i];
    //   const entries = await this._getCaptions(
    //     project._id,
    //     transcription,
    //     systemUser._id,
    //   );
    //   captions.push(...entries.map((o) => new this.db.captionModel(o)));
    // }

    // Bulk insert data
    this.logger.verbose(
      'Insert generated data into the database (this may take some time)',
    );
    await Promise.all([
      this.db.userModel.insertMany([systemUser, admin, ...users]),
      this.db.projectModel.insertMany(projects),
      this.db.transcriptionModel.insertMany(transcriptions),
      this.db.captionModel.insertMany(captions),
    ]);
    this.logger.verbose('Data inserted into database.');

    // Create media files
    this.logger.verbose('Copy example files and create symlinks');
    await this.populateService._clearMediaDirectory();
    await this._copyMediaFiles(projects);

    this.logger.verbose('Populate finished');
  }

  async reset(projectId: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (project.status !== ProjectStatus.LIVE) {
      // if (project.status !== ProjectStatus.PAUSED) { // TODO
      throw new CustomBadRequestException('project_status_is_not_paused');
    }

    await this.db.captionModel.deleteMany({ project: projectId }).exec();
  }

  async start(projectId: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    // if (project.status !== ProjectStatus.PAUSED) {//TODO
    if (project.status !== ProjectStatus.LIVE) {
      throw new CustomBadRequestException('project_status_is_not_paused');
    }

    const systemUser = await this.authService.findSystemAuthUser();

    await this.projectService.update(systemUser, projectId, {
      status: ProjectStatus.LIVE,
    });

    const transcription = (project.transcriptions as Transcription[])[0];

    const captionsCount = await this.db.captionModel.countDocuments({
      project: project._id,
    });

    const entries = await this._getCaptions(
      project._id,
      transcription,
      systemUser.id,
    );

    this.logger.verbose(
      `Found ${entries.length} captions. Start delayed inserting.`,
    );

    const handles: NodeJS.Timeout[] = [];

    for (let i = captionsCount; i < entries.length; i++) {
      const entry = entries[i];
      const handle = setTimeout(async () => {
        this.logger.verbose(
          `${i + 1} / ${entries.length}: ${entry.text
            .replace(/\n/g, ' ')
            .slice(0, 50)}`,
        );
        const doc = await this.db.captionModel.create(entry);
        const caption = doc.toObject();

        // Entity
        const entity = plainToInstance(CaptionEntity, caption);

        // Send events
        this.events.captionCreated(project, entity);
        this.events.userTestUpdated(project._id.toString(), caption.start);
      }, entry.start);

      handles.push(handle);
    }

    this.captionJobs[project._id.toString()] = handles;

    this.events.userTestStart(projectId);
  }

  async downloadResults(projectId: string): Promise<any> {
    const project = await this.db.projectModel
      .findById(projectId)
      .populate([
        {
          path: 'users',
        },
      ])
      .lean()
      .exec();

    const captions = await this.db.captionModel.find({ project: projectId });

    return {
      project: {
        id: project._id,
        title: project.title,
        users: project.users.map((o: LeanUserDocument) => ({
          id: o._id,
          name: o.name,
          email: o.email,
        })),
      },
      captions: captions.map((o) => ({
        id: o._id,
        updatedBy: o.updatedBy,
        wasManuallyEdited: o.wasManuallyEdited,
        text: o.text,
        initialText: o.initialText,
        start: o.start,
        end: o.end,
        speakerId: o.speakerId,
        lockedBy: o.lockedBy,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        history: o.history.map((h) => ({
          id: h._id,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
          createdBy: h.createdBy,
          text: h.text,
        })),
      })),
    };

    return { project, captions };
  }

  async stop(projectId: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (project.status !== ProjectStatus.LIVE) {
      throw new CustomBadRequestException('project_status_is_not_live');
    }

    const systemUser = await this.authService.findSystemAuthUser();

    await this.projectService.update(systemUser, projectId, {
      status: ProjectStatus.LIVE, //TODO
      // status: ProjectStatus.PAUSED,
    });

    // TODO: project events

    const handles = this.captionJobs[project._id.toString()] || [];
    for (const handle of handles) {
      clearTimeout(handle);
    }
    delete this.captionJobs[project._id.toString()];

    this.events.userTestStop(projectId);
  }
}
