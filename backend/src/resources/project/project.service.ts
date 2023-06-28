import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { ReadStream, createReadStream } from 'fs';
import { remove, rm } from 'fs-extra';
import { readFile, stat } from 'fs/promises';
import { Types } from 'mongoose';
import { LeanUserDocument } from 'src/modules/db/schemas/user.schema';
import { DbService } from '../../modules/db/db.service';
import {
  AdditionalMedia,
  LeanProjectDocument,
  MediaType,
  ProjectStatus,
} from '../../modules/db/schemas/project.schema';
import { WaveformData } from '../../modules/ffmpeg/ffmpeg.interfaces';
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
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomInternalServerException,
  CustomNotFoundException,
} from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { ActivityService } from '../activity/activity.service';
import { AuthUser, MediaAccessUser } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { EventsGateway } from '../events/events.gateway';
import { TranscriptionService } from '../transcription/transcription.service';
import { UserRole } from '../user/user.interfaces';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { UpdatePartialProjectDto } from './dto/update-partial-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ProjectInviteTokenEntity } from './entities/project-invite.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { MediaLinksEntity, ProjectEntity } from './entities/project.entity';
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

  _generateInviteToken(): Promise<string> {
    return new Promise((resolve, reject) =>
      randomBytes(64, (err, buffer) =>
        err ? reject(err) : resolve(buffer.toString('base64url')),
      ),
    );
  }

  async _getMediaLinksEntity(
    project: LeanProjectDocument,
    authUser: AuthUser,
  ): Promise<MediaLinksEntity> {
    const mediaAuthToken = await this.authService.createMediaAccessToken(
      authUser,
      {
        projectId: project._id.toString(),
      },
    );

    const video = `${
      this.serverBaseUrl
    }/projects/${project._id.toString()}/media/video?Authorization=${
      mediaAuthToken.token
    }`;

    const audio = `${
      this.serverBaseUrl
    }/projects/${project._id.toString()}/media/audio?Authorization=${
      mediaAuthToken.token
    }`;

    //  additionalVideos
    const additionalVideos = project.additionalMedia
      .filter((media) => media.mediaType === MediaType.VIDEO)
      .map((media) => ({
        id: media._id.toString(),
        title: media.title,
        video: `${
          this.serverBaseUrl
        }/projects/${project._id.toString()}/media/video/${media._id.toString()}?Authorization=${
          mediaAuthToken.token
        }`,
      }));

    return { video, audio, additionalVideos };
  }

  async create(
    authUser: AuthUser,
    createProjectDto: CreateProjectDto,
    video: Array<Express.Multer.File> | null = null,
    subtitles: Array<Express.Multer.File> | null = null,
  ): Promise<ProjectEntity> {
    const inviteToken = await this._generateInviteToken();

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

    //create project
    const project = await this.db.projectModel.create({
      ...createProjectDto,
      createdBy: authUser.id,
      users: [authUser.id, ...userIds],
      status,
      inviteToken,
    });

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
      (project.createdBy as Types.ObjectId).toString(),
      'project-created',
      {},
    );

    // Entity
    const populatedProject = await project.populate([
      'users',
      'transcriptions',
    ]);

    const media = await this._getMediaLinksEntity(populatedProject, authUser);

    const entity = plainToInstance(ProjectEntity, {
      ...populatedProject.toObject(),
      media,
    }) as unknown as ProjectEntity;

    // handle video and subtitle files / add queue jobs / generate subtitles
    await this._handleFilesAndTranscriptions(
      authUser,
      entity,
      video,
      subtitles,
      createProjectDto,
    );

    // Send events
    this.events.projectCreated(entity);

    return entity;
  }

  async _handleFilesAndTranscriptions(
    authUser: AuthUser,
    entity: ProjectEntity,
    video: Express.Multer.File[],
    subtitles: Express.Multer.File[],
    createProjectDto: CreateProjectDto,
  ) {
    //either add jobs to queue or add to subsequent jobs to run after video processing
    const subsequentJobs: ProcessSubtitlesJob[] = [];
    if (subtitles) {
      // use files to generate subtitles
      await Promise.all(
        subtitles.map((file) => {
          this.transcriptionService.create(
            authUser,
            {
              project: new Types.ObjectId(entity._id),
              language: entity.language,
              title: `${entity.title} - ${entity.language}`,
            },
            file,
          );
        }),
      );
    } else if (createProjectDto.asrVendor) {
      const createdTranscription = await this.transcriptionService.create(
        authUser,
        {
          project: new Types.ObjectId(entity._id),
          language: entity.language,
          title: `${entity.title} - ${entity.language}`,
        },
      );

      // generate subtitles
      subsequentJobs.push({
        project: entity,
        transcription: createdTranscription,
        payload: {
          type: SubtitlesType.FROM_ASR,
          vendor: createProjectDto.asrVendor,
        },
      });
    }

    // media file
    if (video) {
      const mediaFile = video[0];
      await this.projectQueue.add({
        project: entity,
        authUser,
        file: mediaFile,
        subsequentJobs,
        videoId: null,
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

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const media = await this._getMediaLinksEntity(project, authUser);

    // Entity
    const entity = plainToInstance(ProjectEntity, { ...project, media });

    return entity;
  }

  // TODO
  async updatePartial(id: string, updatePartialDto: UpdatePartialProjectDto) {
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

    await this.events.projectPartiallyUpdated(
      { ...updatePartialDto },
      updatedProject,
    );
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
      // TODO kommentar wieder raus
      // this.livestreamQueue.add({
      //   projectId: project._id,
      // });
    }

    const oldProject = await this.db.projectModel
      .findByIdAndUpdate(
        id,
        {
          $set: updateProjectDto,
        },
        {
          // new: true,
          populate: ['transcriptions', 'users'],
        },
      )
      .lean()
      .exec();

    // TODO not pretty
    const updatedProject = await this.db.findProjectByIdOrThrow(id);

    // create activites
    if (
      updateProjectDto.status &&
      oldProject.status !== updatedProject.status
    ) {
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

    // append media object
    const media = await this._getMediaLinksEntity(updatedProject, authUser);

    // Entity
    const entity = plainToInstance(ProjectEntity, { ...updatedProject, media });

    if (mediaFile) {
      //update media file
      await this.projectQueue.add({
        project: entity,
        authUser,
        file: mediaFile,
        subsequentJobs: [],
        videoId: null,
      });
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
    rm(projectDir, { recursive: true, force: true });

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
    const project = await this.db.findProjectByIdOrThrowAndPopulate(
      id,
      'createdBy users',
    );

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

    await this.mailService.sendInviteEmail(
      project,
      project.createdBy as LeanUserDocument,
      emails,
    );
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

    const inviteToken = await this._generateInviteToken();

    await this.db.projectModel.findByIdAndUpdate(id, {
      $set: { inviteToken },
    });

    return { inviteToken };
  }

  // upload media
  async getWaveformData(
    authUser: AuthUser,
    projectId: string,
  ): Promise<WaveformData> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const filePath = this.pathService.getWaveformFile(projectId);
    const data = await readFile(filePath, 'utf8');

    return JSON.parse(data) as WaveformData;
  }

  async getVideoChunk(
    projectId: string,
    mediaAccessUser: MediaAccessUser,
    request: Request,
    response: Response,
    videoId: string = null,
  ) {
    if (mediaAccessUser.projectId !== projectId) {
      throw new CustomForbiddenException();
    }

    // https://blog.logrocket.com/full-stack-app-tutorial-nestjs-react/
    // https://betterprogramming.pub/video-stream-with-node-js-and-html5-320b3191a6b6
    // https://www.geeksforgeeks.org/how-to-stream-large-mp4-files/

    let videoFilepath: string;
    if (videoId === null) {
      videoFilepath = this.pathService.getVideoFile(projectId);
    } else {
      videoFilepath = this.pathService.getAdditionalVideoFile(
        projectId,
        videoId,
      );
    }

    try {
      const videoStats = await stat(videoFilepath);

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
        const end = parts[1] ? parseInt(parts[1], 10) : videoStats.size - 1;
        // chunk size is what the part of video we are sending.
        const chunksize = end - start + 1;

        response.status(206); // Parial content header
        response.header({
          'Content-Range': `bytes ${start}-${end}/${videoStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-length': chunksize,
          'Content-Type': 'video/mp4',
        });
        readStream = createReadStream(videoFilepath, {
          start: start,
          end: end,
        });
      } else {
        //if not send the video from start
        response.status(200);
        response.header({
          'Content-Length': videoStats.size,
          'Content-Type': 'video/mp4',
        });
        readStream = createReadStream(videoFilepath);
      }
      // pipe stream to response
      readStream.pipe(response);
    } catch (error) {
      this.logger.error(error.message, { error });
      response.status(400).send('Bad Request');
    }
  }

  async getAudioChunk(
    projectId: string,
    mediaAccessUser: MediaAccessUser,
    request: Request,
    response: Response,
  ) {
    if (mediaAccessUser.projectId !== projectId) {
      throw new CustomForbiddenException();
    }

    // https://blog.logrocket.com/full-stack-app-tutorial-nestjs-react/
    // https://betterprogramming.pub/video-stream-with-node-js-and-html5-320b3191a6b6
    // https://www.geeksforgeeks.org/how-to-stream-large-mp4-files/

    const audioFilepath = this.pathService.getWavFile(projectId);

    try {
      const audioStats = await stat(audioFilepath);

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
        const end = parts[1] ? parseInt(parts[1], 10) : audioStats.size - 1;
        // chunk size is what the part of video we are sending.
        const chunksize = end - start + 1;

        response.status(206); // Parial content header
        response.header({
          'Content-Range': `bytes ${start}-${end}/${audioStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-length': chunksize,
          'Content-Type': 'audio/wav',
        });
        readStream = createReadStream(audioFilepath, {
          start: start,
          end: end,
        });
      } else {
        //if not send the video from start
        response.status(200);
        response.header({
          'Content-Length': audioStats.size,
          'Content-Type': 'audio/wav',
        });
        readStream = createReadStream(audioFilepath);
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
    uploadMediaDto: UploadMediaDto,
    file: Express.Multer.File,
  ): Promise<ProjectEntity> {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const additionalMedia: AdditionalMedia = {
      ...uploadMediaDto,
      _id: new Types.ObjectId(),
      mediaType: MediaType.VIDEO,
    };
    const updatedProject = await this.db.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $push: {
            additionalMedia: additionalMedia,
          },
        },
        { populate: ['users'], new: true },
      )
      .lean()
      .exec();

    this.projectQueue.add({
      authUser,
      project,
      file,
      subsequentJobs: [],
      videoId: additionalMedia._id.toString(),
    });

    return updatedProject;
  }

  async deleteMedia(authUser: AuthUser, projectId: string, mediaId: string) {
    const project = await this.db.findProjectByIdOrThrow(projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('must_be_owner');
    }

    const mediaObj = project.additionalMedia.find((media) =>
      isSameObjectId(media._id, mediaId),
    );

    if (!mediaObj) {
      throw new CustomNotFoundException();
    }

    const path = this.pathService.getAdditionalVideoFile(projectId, mediaId);
    remove(path);

    // TODO does not work
    await this.db.projectModel
      .findByIdAndUpdate(projectId, {
        $pull: { additionalMedia: { _id: new Types.ObjectId(mediaId) } },
      })
      .lean()
      .exec();

    const updatedProject = await this.db.findProjectByIdOrThrow(projectId);

    // append media object
    const media = await this._getMediaLinksEntity(updatedProject, authUser);
    // Entity
    const entity = plainToInstance(ProjectEntity, { ...updatedProject, media });

    await this.events.projectUpdated(entity);
  }
}
