import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';
import { ReadStream, createReadStream } from 'fs';
import { ensureDir, remove, rm } from 'fs-extra';
import { stat } from 'fs/promises';
import { Types } from 'mongoose';
import { LeanUserDocument } from 'src/modules/db/schemas/user.schema';
import { DbService } from '../../modules/db/db.service';
import {
  Audio,
  MediaCategory,
  MediaStatus,
  Project,
  ProjectStatus,
  Video,
} from '../../modules/db/schemas/project.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { MailService } from '../../modules/mail/mail.service';
import { PathService } from '../../modules/path/path.service';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { ProcessLivestreamJob } from '../../processors/livestream.processor';
import {
  ProcessProjectJob,
  ProcessSubtitlesJob,
  SubtitlesType,
} from '../../processors/processor.interfaces';
import { generateSecureToken } from '../../utils/crypto';
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomInternalServerException,
  CustomNotFoundException,
} from '../../utils/exceptions';
import { getObjectIdAsString, isSameObjectId } from '../../utils/objectid';
import { ActivityService } from '../activity/activity.service';
import { AuthUser, MediaAccessUser } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { EventsGateway } from '../events/events.gateway';
import { TranscriptionService } from '../transcription/transcription.service';
import { UserRole } from '../user/user.interfaces';
import { CreateLegacyProjectDto } from './dto/create-legacy-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { UpdatePartialProjectDto } from './dto/update-partial-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadVideoDto } from './dto/upload-media.dto';
import { ProjectInviteTokenEntity } from './entities/project-invite.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { ProjectViewerTokenEntity } from './entities/project-viewer.entity';
import {
  AudioEntity,
  ProjectEntity,
  ProjectMediaEntity,
  VideoEntity,
} from './entities/project.entity';
@Injectable()
export class ProjectService {
  private serverBaseUrl: string;

  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private permissions: PermissionsService,
    private events: EventsGateway,
    private mailService: MailService,
    private activityService: ActivityService,
    private pathService: PathService,
    private transcriptionService: TranscriptionService,
    private configService: ConfigService,
    private authService: AuthService,
    @InjectQueue('project') private projectQueue: Queue<ProcessProjectJob>,
    @InjectQueue('livestream')
    private livestreamQueue: Queue<ProcessLivestreamJob>,
  ) {
    this.logger.setContext(this.constructor.name);
    this.serverBaseUrl = this.configService.get<string>('baseUrl');
  }

  async create(
    authUser: AuthUser,
    createProjectDto: CreateProjectDto,
    videoFiles: Array<Express.Multer.File> | null = null,
    subtitleFiles: Array<Express.Multer.File> | null = null,
  ) {
    const status = ProjectStatus.WAITING;

    if (
      !createProjectDto.videoOptions.some(
        (v) => v.category === MediaCategory.MAIN,
      )
    ) {
      this._setDefaultMainCategory(createProjectDto);
    }

    const mainVideo: Video = {
      _id: new Types.ObjectId(),
      category: MediaCategory.MAIN,
      extension: 'mp4',
      originalFileName: '',
      status: MediaStatus.WAITING,
      title: 'Main Video',
      resolutions: [],
    };

    const mainAudio: Audio = {
      _id: new Types.ObjectId(),
      category: MediaCategory.MAIN,
      extension: 'mp3',
      originalFileName: '',
      status: MediaStatus.WAITING,
      title: 'Main Audio',
    };

    //create project
    const project = await this.db.projectModel.create({
      title: createProjectDto.title,
      language: createProjectDto.language,
      createdBy: authUser.id,
      users: [authUser.id],
      status,
      inviteToken: generateSecureToken(),
      viewerToken: generateSecureToken(),
      videos: [mainVideo],
      audios: [mainAudio],
    });

    await ensureDir(
      this.pathService.getProjectDirectory(project._id.toString()),
    );

    // add project to owner
    await this.db.userModel
      .updateOne({ _id: authUser.id }, { $push: { projects: project._id } })
      .lean()
      .exec();

    // Create activity
    await this.activityService.create(
      project.toObject(),
      getObjectIdAsString(project.createdBy),
      'project-created',
      {},
    );

    // Entity
    const populatedProject = await this.db.findProjectByIdOrThrow(project._id);

    // handle video and subtitle files / add queue jobs / generate subtitles
    await this._handleFilesAndTranscriptions(
      authUser,
      populatedProject,
      videoFiles,
      subtitleFiles,
      createProjectDto,
      mainVideo,
      mainAudio,
    );

    const entity = plainToInstance(ProjectEntity, {
      ...populatedProject,
    }) as unknown as ProjectEntity;

    // Send events

    this.events.projectCreated(entity);
    return entity;
  }

  private _setDefaultMainCategory(createProjectDto: CreateProjectDto) {
    if (createProjectDto.videoOptions.length === 1) {
      // there is only 1 video, make it the main video
      createProjectDto.videoOptions[0].category = MediaCategory.MAIN;
    } else {
      if (createProjectDto.videoOptions.filter((x) => x.useAudio).length) {
        // there is only 1 useAudio video, make it the main video
        createProjectDto.videoOptions.find((v) => v.useAudio).category =
          MediaCategory.MAIN;
      } else {
        // if several useAudio videos -> take speaker->slides->other->signlanguage
        let foundIndex: number;

        foundIndex = createProjectDto.videoOptions.findIndex(
          (v) => v.useAudio && v.category === MediaCategory.SPEAKER,
        );
        if (foundIndex < 0)
          foundIndex = createProjectDto.videoOptions.findIndex(
            (v) => v.useAudio && v.category === MediaCategory.SLIDES,
          );
        if (foundIndex < 0)
          foundIndex = createProjectDto.videoOptions.findIndex(
            (v) => v.useAudio && v.category === MediaCategory.OTHER,
          );
        if (foundIndex < 0)
          foundIndex = createProjectDto.videoOptions.findIndex(
            (v) => v.useAudio && v.category === MediaCategory.SIGN_LANGUAGE,
          );

        createProjectDto.videoOptions[foundIndex].category = MediaCategory.MAIN;
      }
    }
  }

  async _handleFilesAndTranscriptions(
    authUser: AuthUser,
    project: Project,
    videoFiles: Express.Multer.File[],
    subtitleFiles: Express.Multer.File[],
    createProjectDto: CreateProjectDto,
    mainVideo: Video,
    mainAudio: Audio,
  ) {
    const subsequentJobs: ProcessSubtitlesJob[] = [];
    if (subtitleFiles) {
      // use files to generate subtitles
      await Promise.all(
        subtitleFiles.map((file, i) => {
          const language = createProjectDto.subtitleOptions[i].language;

          this.transcriptionService.create(
            authUser,
            {
              project: new Types.ObjectId(project._id),
              language: language,
            },
            file,
          );
        }),
      );
    }

    if (createProjectDto.asrVendor) {
      const createdTranscription = await this.transcriptionService.create(
        authUser,
        {
          project: new Types.ObjectId(project._id),
          language: project.language,
        },
      );

      // generate subtitles
      subsequentJobs.push({
        project: project,
        transcription: createdTranscription,
        payload: {
          type: SubtitlesType.FROM_ASR,
          vendor: createProjectDto.asrVendor,
          audio: mainAudio,
        },
      });
    }

    let mainVideoIndex = createProjectDto.videoOptions.findIndex(
      (v) => v.category === MediaCategory.MAIN,
    );

    const mainMediaFile = videoFiles[mainVideoIndex];

    await this.projectQueue.add({
      project: project,
      authUser,
      file: mainMediaFile,
      subsequentJobs,
      mainVideo: mainVideo,
      mainAudio: mainAudio,
      recorder: false,
    });

    if (createProjectDto.videoOptions.length > 1) {
      videoFiles.forEach((file, i) => {
        if (i !== mainVideoIndex) {
          const mediaCategoryKey = Object.entries(MediaCategory).find(
            ([key, value]) => {
              if (value === createProjectDto.videoOptions[i].category)
                return key;
            },
          );

          const title =
            mediaCategoryKey[1].charAt(0).toUpperCase() +
            mediaCategoryKey[1].slice(1);
          this.uploadVideo(
            authUser,
            project._id.toString(),
            {
              title: title,
              category: MediaCategory[mediaCategoryKey[0]],
              recorder: false,
            },
            file,
          );
        }
      });
    }
  }

  async createLegacy(
    authUser: AuthUser,
    createProjectDto: CreateLegacyProjectDto,
    videoFiles: Array<Express.Multer.File> | null = null,
    subtitleFiles: Array<Express.Multer.File> | null = null,
  ): Promise<ProjectEntity> {
    // const inviteToken = await this._generateInviteToken();

    let users = null;
    let userIds: Types.ObjectId[] = [];
    // find all users
    if (createProjectDto.emails) {
      users = await this.db.userModel
        .find({
          email: {
            $in: [...createProjectDto.emails],
          },
        })
        .lean()
        .exec();
      userIds = users.map((o) => o._id);
    }

    const status = createProjectDto.url
      ? ProjectStatus.LIVE
      : ProjectStatus.WAITING;

    const mainVideo: Video = {
      _id: new Types.ObjectId(),
      category: MediaCategory.MAIN,
      extension: 'mp4',
      originalFileName: '',
      status: MediaStatus.WAITING,
      title: 'Main Video',
      resolutions: [],
    };

    const mainAudio: Audio = {
      _id: new Types.ObjectId(),
      category: MediaCategory.MAIN,
      extension: 'mp3',
      originalFileName: '',
      status: MediaStatus.WAITING,
      title: 'Main Audio',
    };

    //create project
    const project = await this.db.projectModel.create({
      ...createProjectDto,
      createdBy: authUser.id,
      users: [authUser.id, ...userIds],
      status,
      inviteToken: generateSecureToken(),
      viewerToken: generateSecureToken(),
      videos: [mainVideo],
      audios: [mainAudio],
    });

    await ensureDir(
      this.pathService.getProjectDirectory(project._id.toString()),
    );

    // add project to owner and invited users
    await this.db.userModel
      .updateMany(
        {
          _id: {
            $in: [authUser.id, ...userIds],
          },
        },
        { $push: { projects: project._id } },
      )
      .lean()
      .exec();

    // filter all unknown emails & send invites
    if (createProjectDto.emails) {
      const addedMails = users.map((o) => o.email);
      const inviteNeeded = createProjectDto.emails.filter(
        (o) => !addedMails.includes(o),
      );

      const user = await this.db.userModel.findById(authUser.id);
      this.mailService.sendInviteEmail(project, user, inviteNeeded);
    }

    // Create activity
    await this.activityService.create(
      project.toObject(),
      getObjectIdAsString(project.createdBy),
      // (project.createdBy as Types.ObjectId).toString(),
      'project-created',
      {},
    );

    // Entity

    const populatedProject = await this.db.findProjectByIdOrThrow(project._id);
    // await project.populate([
    //   'users',
    //   'transcriptions',
    // ]);

    // handle video and subtitle files / add queue jobs / generate subtitles
    await this._legacyHandleFilesAndTranscriptions(
      authUser,
      populatedProject,
      videoFiles,
      subtitleFiles,
      createProjectDto,
      mainVideo,
      mainAudio,
    );

    const entity = plainToInstance(ProjectEntity, {
      ...populatedProject,
    }) as unknown as ProjectEntity;

    // Send events
    this.events.projectCreated(entity);

    return entity;
  }

  async _legacyHandleFilesAndTranscriptions(
    authUser: AuthUser,
    project: Project,
    videoFiles: Express.Multer.File[],
    subtitleFiles: Express.Multer.File[],
    createProjectDto: CreateLegacyProjectDto,
    mainVideo: Video,
    mainAudio: Audio,
  ) {
    //either add jobs to queue or add to subsequent jobs to run after video processing
    const subsequentJobs: ProcessSubtitlesJob[] = [];
    if (subtitleFiles) {
      // use files to generate subtitles
      await Promise.all(
        subtitleFiles.map((file) => {
          this.transcriptionService.create(
            authUser,
            {
              project: new Types.ObjectId(project._id),
              language: project.language,
              title: `${project.title} - ${project.language}`,
            },
            file,
          );
        }),
      );
    } else if (createProjectDto.asrVendor) {
      const createdTranscription = await this.transcriptionService.create(
        authUser,
        {
          project: new Types.ObjectId(project._id),
          language: project.language,
          title: `${project.title} - ${project.language}`,
        },
      );

      // generate subtitles
      subsequentJobs.push({
        project: project,
        transcription: createdTranscription,
        payload: {
          type: SubtitlesType.FROM_ASR,
          vendor: createProjectDto.asrVendor,
          audio: mainAudio,
        },
      });
    } else {
      //  create empty transcription
      const emptyTranscription = await this.transcriptionService.create(
        authUser,
        {
          project: new Types.ObjectId(project._id),
          language: project.language,
          title: `${project.title} - ${project.language}`,
        },
      );
      await this.transcriptionService.createSpeakers(
        authUser,
        emptyTranscription._id.toString(),
        {
          names: ['Sprecher 1'],
        },
      );
    }

    // media file
    if (videoFiles) {
      const mediaFile = videoFiles[0];
      await this.projectQueue.add({
        project: project,
        authUser,
        file: mediaFile,
        subsequentJobs,
        mainVideo: mainVideo,
        mainAudio: mainAudio,
        recorder: true,
      });
    }
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllProjectsQuery,
  ): Promise<ProjectListEntity> {
    const user = await this.db.userModel.findById(authUser.id).lean().exec();

    const { limit, page = 1 } = query;
    const skip = limit ? limit * (page - 1) : undefined;

    const projects = await this.db.projectModel
      .find({ _id: { $in: user.projects } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([{ path: 'transcriptions' }, { path: 'users' }])
      .lean()
      .exec();

    // Entity
    const entity = plainToInstance(ProjectListEntity, {
      projects,
      total: user.projects.length,
      page,
      count: projects.length,
    });

    return entity;
  }

  async findOne(authUser: AuthUser, id: string): Promise<ProjectEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectReadable(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    // Entity
    const entity = plainToInstance(ProjectEntity, project);

    return entity;
  }

  async _updatePartial(id: string, updatePartialDto: UpdatePartialProjectDto) {
    const project = await this.db.findProjectByIdOrThrow(id);
    const updatedProject = await this.db.projectModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updatePartialDto,
            livestream: {
              ...project.livestream,
              ...updatePartialDto.livestream,
            },
          },
        },
        { populate: ['users'], new: true },
      )
      .lean()
      .exec();

    await this.events.projectPartiallyUpdated(updatedProject, {
      ...updatePartialDto,
    });

    return updatedProject;
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateProjectDto: UpdateProjectDto,
    mediaFile: Express.Multer.File = null,
  ): Promise<ProjectEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const isOwner = this.permissions.isProjectOwner(project, authUser);

    if (
      authUser.role !== UserRole.SYSTEM &&
      updateProjectDto.status &&
      !this.permissions.isProjectStatusEditable(
        isOwner,
        project,
        updateProjectDto.status,
      )
    ) {
      throw new CustomForbiddenException('editing_project_status_denied');
    }

    // Add job to livestream queue
    if (
      updateProjectDto.status === ProjectStatus.LIVE &&
      project.status !== ProjectStatus.LIVE
    ) {
      // TODO
      // this.livestreamQueue.add({
      //   projectId: project._id,
      // });
    }
    const updatedProject = await this.db.updateProjectByIdAndReturn(id, {
      $set: updateProjectDto,
    });

    // create activites
    if (updateProjectDto.status && project.status !== updatedProject.status) {
      await this.activityService.create(
        updatedProject,
        authUser.id,
        'project-status-updated',
        { before: project.status, after: updatedProject.status },
      );
    }
    if (updateProjectDto.title && project.title !== updatedProject.title) {
      await this.activityService.create(
        updatedProject,
        authUser.id,
        'project-title-updated',
        { before: project.title, after: updatedProject.title },
      );
    }

    // Entity
    const entity = plainToInstance(ProjectEntity, updatedProject);

    // TODO What should happen if someone updates the project with a mediafile
    if (mediaFile) {
      //update media file
      // await this.projectQueue.add({
      //   project: entity,
      //   authUser,
      //   file: mediaFile,
      //   subsequentJobs: [],
      //   videoId: null,
      // });
    }

    // Send events
    this.events.projectUpdated(entity);

    return entity;
  }

  async remove(authUser: AuthUser, id: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    await Promise.all([
      // Delete project
      this.db.projectModel.findByIdAndDelete(id),
      // Remove project from users
      ...project.users.map((userId) =>
        this.db.userModel.findByIdAndUpdate(userId, {
          $pullAll: { projects: [id] },
        }),
      ),
    ]);

    // TODO remove files on delete proj -> vllt in eine queue? damit es wiederholt wird falls es failed
    const projectDir = this.pathService.getProjectDirectory(id);
    try {
      rm(projectDir, { recursive: true, force: true });
    } catch (e) {
      // could not delete files
      console.log('could not delete files ' + id);
      console.log(e);
    }

    // Send events
    this.events.projectRemoved(project);
  }

  async subscribe(authUser: AuthUser, id: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    try {
      await this.events.joinProjectRoom(authUser, project);
    } catch (err) {
      if (err.message === 'user_socket_not_found') {
        throw new CustomBadRequestException('user_not_connected');
      }
      throw new CustomInternalServerException('project_subscribe_failed', err);
    }
  }

  async unsubscribe(authUser: AuthUser, id: string): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    try {
      await this.events.leaveProjectRoom(authUser, project);
    } catch (err) {
      if (err.message === 'user_socket_not_found') {
        throw new CustomBadRequestException('user_not_connected');
      }
      throw new CustomInternalServerException(
        'project_unsubscribe_failed',
        err,
      );
    }
  }

  async invite(authUser: AuthUser, id: string, dto: InviteDto): Promise<void> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    // Filter emails of users that already joined the project
    const emails = dto.emails.filter(
      (email) =>
        !(project.users as LeanUserDocument[]).some(
          (user) => user.email === email,
        ),
    );

    // add exising users

    const missingEmails = [];

    await Promise.all(
      emails.map(async (email) => {
        const user = await this.db.userModel.findOne({ email });
        if (user) {
          await this.db.userModel.findOneAndUpdate(
            { email },
            { $push: { projects: id } },
          );
          await this.db.projectModel.findByIdAndUpdate(id, {
            $push: { users: user },
          });
        } else {
          missingEmails.push(email);
        }
      }),
    );

    // TODO invite users that are not registered
    if (missingEmails.length > 0) {
      await this.mailService.sendInviteEmail(
        project,
        project.createdBy as LeanUserDocument,
        missingEmails,
      );
    }

    const updatedProject = await this.db.findProjectByIdOrThrow(id);

    // Entity
    const entity = plainToInstance(ProjectEntity, updatedProject);

    await this.events.projectUpdated(entity);
  }

  async removeUserFromProject(
    authUser: AuthUser,
    projectId: string,
    userId: string,
  ) {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    // NOT allowed to remove project owner
    if (isSameObjectId(userId, project.createdBy)) {
      throw new CustomForbiddenException('cannot_remove_owner');
    }

    // ALLOWED to remove yourself from project as a user or as project owner
    if (
      isSameObjectId(userId, authUser.id) ||
      this.permissions.isProjectOwner(project, authUser)
    ) {
      const updatedUserList = project.users.filter(
        (user) => !isSameObjectId(user._id, userId),
      );

      await this.db.userModel.findByIdAndUpdate(userId, {
        $pullAll: { projects: [project._id] },
      });

      const updatedProject = await this.db.updateProjectByIdAndReturn(
        projectId,
        {
          $set: { users: updatedUserList },
        },
      );

      const entity = plainToInstance(ProjectEntity, updatedProject);
      await this.events.projectUpdated(entity, [userId]);
    } else {
      throw new CustomForbiddenException('must_be_owner');
    }
  }

  async getViewerToken(
    authUser: AuthUser,
    id: string,
  ): Promise<ProjectViewerTokenEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    return { viewerToken: project.viewerToken };
  }

  async updateViewerToken(
    authUser: AuthUser,
    id: string,
  ): Promise<ProjectViewerTokenEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const viewerToken = generateSecureToken();

    await this.db.projectModel.findByIdAndUpdate(id, {
      $set: { viewerToken },
    });

    return { viewerToken };
  }

  async getInviteToken(
    authUser: AuthUser,
    id: string,
  ): Promise<ProjectInviteTokenEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    return { inviteToken: project.inviteToken };
  }

  async updateInviteToken(
    authUser: AuthUser,
    id: string,
  ): Promise<ProjectInviteTokenEntity> {
    const project = await this.db.findProjectByIdOrThrow(id);

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const inviteToken = generateSecureToken();

    await this.db.projectModel.findByIdAndUpdate(id, {
      $set: { inviteToken },
    });

    return { inviteToken };
  }

  async joinViaInviteToken(
    authUser: AuthUser,
    inviteToken: string,
  ): Promise<void> {
    const verifyInvite = await this.authService.verifyInvite(inviteToken);
    const project = await this.db.findProjectByIdOrThrow(
      verifyInvite.projectId,
    );
    const user = await this.db.userModel.findById(authUser.id);

    if (user.projects.includes(project._id))
      throw new CustomBadRequestException('already_member_of_project');

    await Promise.all([
      this.db.userModel.findByIdAndUpdate(user._id, {
        $push: { projects: project._id },
      }),
      this.db.projectModel.findByIdAndUpdate(project._id, {
        $push: { users: user },
      }),
    ]);
  }

  async getMediaChunk(
    projectId: string,
    mediaAccessUser: MediaAccessUser,
    request: Request,
    response: Response,
    filename: string,
  ) {
    if (mediaAccessUser.projectId !== projectId) {
      throw new CustomForbiddenException();
    }

    const [mediaId, ext] = filename.split('.');

    // https://blog.logrocket.com/full-stack-app-tutorial-nestjs-react/
    // https://betterprogramming.pub/video-stream-with-node-js-and-html5-320b3191a6b6
    // https://www.geeksforgeeks.org/how-to-stream-large-mp4-files/

    // const audioFilepath = this.pathService.getMp3File(projectId);
    const mediaFilepath = this.pathService.getFile(projectId, filename);

    try {
      const fileStats = await stat(mediaFilepath);

      const { range } = request.headers;
      let readStream: ReadStream;
      if (range) {
        // version 1
        // send in 1MB chunks
        // const CHUNK_SIZE2 = 1 * 1e6;
        // const start = Number(range.replace(/\D/g, ''));
        // const end = Math.min(start2 + CHUNK_SIZE2, videoStats.size - 1);
        // const chunksize = end - start + 1;

        // version 2
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        // in some cases end may not exists, if its not exists make it end of file
        const end = parts[1] ? parseInt(parts[1], 10) : fileStats.size - 1;
        // chunk size is what the part of video we are sending.
        const chunksize = end - start + 1;

        response.status(206); // Parial content header
        response.header({
          'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-length': chunksize,
          'Content-Type': this._getMimetype(ext),
        });
        readStream = createReadStream(mediaFilepath, {
          start: start,
          end: end,
        });
      } else {
        //if not send the video from start
        response.status(200);
        response.header({
          'Content-Length': fileStats.size,
          'Content-Type': this._getMimetype(ext),
        });
        readStream = createReadStream(mediaFilepath);
      }
      // pipe stream to response
      readStream.pipe(response);
    } catch (error) {
      this.logger.error(error.message, { error });
      response.status(400).send('Bad Request');
    }
  }

  // upload file
  async uploadVideo(
    authUser: AuthUser,
    projectId: string,
    uploadVideoDto: UploadVideoDto,
    file: Express.Multer.File,
  ): Promise<ProjectEntity> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const video: Video = {
      ...uploadVideoDto,
      category: uploadVideoDto.category ?? MediaCategory.OTHER,
      title: uploadVideoDto.title ?? '',
      _id: new Types.ObjectId(),
      originalFileName: file.filename,
      status: MediaStatus.WAITING,
      extension: 'mp4',
      resolutions: [],
    };

    const updatedProject = await this.db.updateProjectByIdAndReturn(projectId, {
      $push: {
        videos: video,
      },
    });
    // const updatedProject = await this.db.projectModel
    //   .findByIdAndUpdate(
    //     projectId,
    //     {
    //       $push: {
    //         videos: video,
    //       },
    //     },
    //     { populate: ['users'], new: true },
    //   )
    //   .lean()
    //   .exec();

    this.projectQueue.add({
      authUser,
      project,
      file,
      subsequentJobs: [],
      mainVideo: video,
      recorder: uploadVideoDto.recorder,
    });

    return updatedProject;
  }

  async _updateMedia(
    projectId: string,
    media: Audio | Video,
    newStatus: MediaStatus,
  ) {
    await Promise.all([
      this.db.projectModel
        .updateOne(
          { _id: projectId, 'audios._id': media._id },
          { $set: { 'audios.$.status': newStatus } },
        )
        .exec(),

      this.db.projectModel
        .updateOne(
          { _id: projectId, 'videos._id': media._id },
          { $set: { 'videos.$.status': newStatus } },
        )
        .exec(),
    ]);
  }

  async deleteMedia(
    authUser: AuthUser,
    projectId: string,
    mediaId: string,
  ): Promise<ProjectMediaEntity> {
    const project = await this.db.findProjectByIdOrThrow(projectId);
    // TODO refactor -> what if main delted?

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const mediaObj = project.videos.find((media) =>
      isSameObjectId(media._id, mediaId),
    );

    if (!mediaObj) {
      throw new CustomNotFoundException();
    }

    if (mediaObj.category === MediaCategory.MAIN) {
      throw new CustomForbiddenException('can_not_delete_main_video');
    }

    const path = this.pathService.getBaseMediaFile(projectId, mediaObj);
    remove(path);

    project.videos.forEach((video) => {
      if (video._id.toString() === mediaId) {
        video.resolutions.forEach((res) => {
          remove(
            this.pathService.getVideoFile(projectId, video, res.resolution),
          );
        });
      }
    });

    await this.db.projectModel
      .findByIdAndUpdate(projectId, {
        $pull: { videos: { _id: new Types.ObjectId(mediaId) } },
      })
      .lean()
      .exec();

    const updatedProject = await this.db.findProjectByIdOrThrow(projectId);

    // Entity
    const entity = plainToInstance(ProjectEntity, updatedProject);

    await this.events.projectUpdated(entity);

    return this.getMediaEntity(authUser, projectId);
  }

  async getMediaEntity(
    authUser: AuthUser,
    projectId: string,
  ): Promise<ProjectMediaEntity> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    // if (!this.permissions.isProjectMember(project, authUser)) {
    if (!this.permissions.isProjectReadable(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const mediaAuthToken = this.authService.createMediaAccessToken(projectId);

    const audios: AudioEntity[] = project.audios.map((audio) => ({
      ...audio,
      mimetype: this._getMimetype(audio.extension),
      url: this._buildUrl(
        project.viewerToken,
        audio._id.toString(),
        audio.extension,
        'stereo',
      ),
      waveform: this._buildUrl(
        project.viewerToken,
        audio._id.toString(),
        'json',
      ),
    }));
    const videos: VideoEntity[] = project.videos.map((video) => ({
      ...video,
      mimetype: this._getMimetype(video.extension),
      url: this._buildUrl(project.viewerToken, video._id.toString(), 'mp4'),
      resolutions: video.resolutions.map((res) => ({
        ...res,
        url: this._buildUrl(
          project.viewerToken,
          video._id.toString(),
          video.extension,
          res.resolution,
        ),
      })),
      // url: this._buildUrl(
      //   project._id.toString(),
      //   project.viewerToken,
      //   video._id.toString(),
      //   video.extension,
      // ),
    }));

    return plainToInstance(ProjectMediaEntity, { audios, videos });
  }

  private _buildUrl(
    viewerToken: string,
    mediaId: string,
    mediaExtension: string,
    addition?: string,
  ): string {
    return addition
      ? `${this.serverBaseUrl}/media/${viewerToken}/${mediaId}_${addition}.${mediaExtension}`
      : `${this.serverBaseUrl}/media/${viewerToken}/${mediaId}.${mediaExtension}`;
  }

  private _getMimetype(extension: string) {
    switch (extension) {
      // AUDIO
      case 'mp3':
        return 'audio/mp3';
      case 'wav':
        return 'audio/wav';

      // VIDEO
      case 'mp4':
        return 'video/mp4';

      // TEXT
      case 'json':
        return 'application/json';

      // unknown
      default:
        return 'text/plain';
    }
  }
}
