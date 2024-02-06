import { Injectable } from '@nestjs/common';
import {
  ClientInstance,
  getSingleton,
  MediaPipeline,
  PlayerEndpoint,
  RecorderEndpoint,
  ServerManager,
  WebRtcEndpoint,
} from 'kurento-client';
import { DbService } from '../../modules/db/db.service';
import {
  LeanProjectDocument,
  LivestreamStatus,
  ProjectStatus,
  RecordingStatus,
  RecordingTimestamp,
  RecordingTimestampType,
} from '../../modules/db/schemas/project.schema';
import { CustomLogger } from '../../modules/logger/logger.service';
import { PathService } from '../../modules/path/path.service';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomInternalServerException,
} from '../../utils/exceptions';
import { AuthUser } from '../auth/auth.interfaces';
import { AuthService } from '../auth/auth.service';
import { EventsGateway } from '../events/events.gateway';
import { ProjectService } from '../project/project.service';
import { ConnectLivestreamDto } from './dto/connect-stream.dto';
import { PauseRecordingDto } from './dto/pause-recording.dto';
import { PauseLivestreamDto } from './dto/pause-stream.dto';
import { ResumeRecordingDto } from './dto/resume-recording.dto';
import { ResumeLivestreamDto } from './dto/resume-stream.dto';
import { StartRecordingDto } from './dto/start-recording.dto';
import { StartLivestreamDto } from './dto/start-stream.dto';
import { StopRecordingDto } from './dto/stop-recording.dto';
import { StopLivestreamDto } from './dto/stop-stream.dto';
import { ConnectLivestreamEntity } from './entities/connect-stream.entity';
import { PauseRecordingEntity } from './entities/pause-recording.entity';
import { PauseLivestreamEntity } from './entities/pause-stream.entity';
import { ResumeRecordingEntity } from './entities/resume-recording.entity';
import { ResumeLivestreamEntity } from './entities/resume-stream.entity';
import { StartRecordingEntity } from './entities/start-recording.entity';
import { StartLivestreamEntity } from './entities/start-stream.entity';
import { StopRecordingEntity } from './entities/stop-recording.entity';
import { StopLivestreamEntity } from './entities/stop-stream.entity';

@Injectable()
export class LivestreamService {
  private client: ClientInstance;
  private serverManager: ServerManager;

  constructor(
    private events: EventsGateway,
    private logger: CustomLogger,
    private db: DbService,
    private pathService: PathService,
    private projectSerivce: ProjectService,
    private authService: AuthService,
    private permissions: PermissionsService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async onApplicationBootstrap() {
    try {
      this.client = await getSingleton('ws://localhost:8888/kurento', {
        failAfter: 5,
      });
      this.serverManager = await this.client.getServerManager();
    } catch (error) {
      if (error.message === 'Connection error') {
        this.logger.error('Connection to kurento media server failed', {
          error,
        });
      } else {
        throw new CustomInternalServerException('kurento_client_init_failed', {
          error,
        });
      }
    }

    if (this.client) {
      this.events.onClientIceCandidate$.subscribe(async (event) => {
        const candidate = JSON.parse(event.candidate);
        if (candidate) {
          const project = await this.db.findProjectByIdOrThrow(event.projectId);
          const pipelineId = await this._getPipelineIdOrThrow(project);
          const { clients } = await this._getEndpoints(pipelineId);
          await Promise.all(
            clients.map(async (client) => {
              const clientName = await client.getName();
              if (clientName === event.userId) {
                // console.log(`add candidate for ${client.id}`);
                await client.addIceCandidate(
                  candidate,
                  //   (err) => {
                  //   if (err) console.log('error in addIceCandidate', err);
                  // }
                );
              }
            }),
          );
        }
      });
    }
  }

  async connect(
    authUser: AuthUser,
    dto: ConnectLivestreamDto,
  ): Promise<ConnectLivestreamEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { player, pipeline } = await this._getEndpoints(mediaPipelineId);

    const endpoint = await pipeline.create('WebRtcEndpoint');
    await endpoint.setName(authUser.id);

    endpoint.on('IceComponentStateChange', (ev) => {
      // console.log(`IceComponentStateChange`, ev.state),
    });

    // console.log(`connect user ${authUser.id} to ${endpoint.id}`);

    endpoint.on('IceCandidateFound', (event) => {
      // console.log(`send candidate to client ${endpoint.id}`);
      this.events.serverIceCandidate(authUser, JSON.stringify(event.candidate));
    });

    const sdpAnswer = await endpoint.processOffer(dto.sdpOffer);

    await player.connect(endpoint);

    await endpoint.gatherCandidates();

    return { sdpAnswer };
  }

  async start(
    authUser: AuthUser,
    dto: StartLivestreamDto,
  ): Promise<StartLivestreamEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    // RELEASE PIPELINE

    if (project?.livestream?.mediaPipelineId) {
      try {
        const pipeline = await this.client.getMediaobjectById(
          project.livestream.mediaPipelineId,
        );
        if (pipeline) {
          await pipeline.release();
        }
      } catch (error) {}
    }

    // START NEW

    const pipeline = await this.client.create('MediaPipeline');
    await pipeline.setName(dto.projectId);
    console.log(`pipeline created ${pipeline.id}`);

    // STREAM
    const playerEndpoint = await pipeline.create('PlayerEndpoint', {
      uri: 'video.mp4',
    });

    // await playerEndpoint.connect(endpoint);
    await playerEndpoint.play();

    // RECORDER
    const recorder = await pipeline.create('RecorderEndpoint', {
      uri: `${dto.projectId}/recording.mp4`,
      mediaProfile: 'MP4',
      stopOnEndOfStream: true,
    });

    await playerEndpoint.connect(recorder);

    // FILTER

    // const filter = (await pipeline.create('FaceOverlayFilter')) as any;
    // endpoint.on('MediaStateChanged', (ev) => console.log(ev));
    // endpoint.on('NewCandidatePairSelected', (ev) => console.log(ev));

    // await filter.setOverlayedImage(
    //   'http://files.openvidu.io/img/mario-wings.png',
    //   -0.35,
    //   -1.2,
    //   1.6,
    //   1.6,
    // );

    // await endpoint.connect(filter);
    // await filter.connect(endpoint);

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      duration: 0,
      livestream: {
        url: '',
        mediaPipelineId: pipeline.id,
        recordingStatus: RecordingStatus.NOT_STARTED,
        livestreamStatus: LivestreamStatus.STARTED,
        recordingTimestamps: [],
      },
    });
    return {};
  }

  async stop(
    authUser: AuthUser,
    dto: StopLivestreamDto,
  ): Promise<StopLivestreamEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { pipeline, player } = await this._getEndpoints(mediaPipelineId);

    await player.stop();
    await pipeline.release();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.DRAFT,
      livestream: {
        url: null,
        mediaPipelineId: null,
        recordingStatus: RecordingStatus.NOT_STARTED,
        livestreamStatus: LivestreamStatus.STOPPED,
        recordingTimestamps: [],
      },
    });

    return {};
  }

  async resume(
    authUser: AuthUser,
    dto: ResumeLivestreamDto,
  ): Promise<ResumeLivestreamEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { player } = await this._getEndpoints(mediaPipelineId);

    await player.play();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      livestream: {
        livestreamStatus: LivestreamStatus.STARTED,
      },
    });

    return {};
  }

  async pause(
    authUser: AuthUser,
    dto: PauseLivestreamDto,
  ): Promise<PauseLivestreamEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { player } = await this._getEndpoints(mediaPipelineId);

    await player.pause();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      livestream: {
        livestreamStatus: LivestreamStatus.PAUSED,
      },
    });

    return {};
  }

  // RECORDING STREAM

  async startRecording(
    authUser: AuthUser,
    dto: StartRecordingDto,
  ): Promise<StartRecordingEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (project.livestream.recordingStatus != RecordingStatus.NOT_STARTED) {
      throw new CustomBadRequestException('invalid_recording_status_change');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { recorder } = await this._getEndpoints(mediaPipelineId);

    await recorder.record();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      livestream: {
        recordingStatus: RecordingStatus.RECORDING,
        recordingTimestamps: [
          { type: RecordingTimestampType.START, timestamp: new Date() },
        ],
      },
    });

    return {};
  }

  async stopRecording(
    authUser: AuthUser,
    dto: StopRecordingDto,
  ): Promise<StopRecordingEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (
      [RecordingStatus.NOT_STARTED, RecordingStatus.STOPPED].includes(
        project.livestream.recordingStatus,
      )
    ) {
      throw new CustomBadRequestException('invalid_recording_status_change');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { pipeline, recorder } = await this._getEndpoints(mediaPipelineId);

    await recorder.stopAndWait();

    const recordingTimestamps = [
      ...project.livestream.recordingTimestamps,
      { type: RecordingTimestampType.STOP, timestamp: new Date() },
    ];

    // TODO get duration of recording

    // await move(
    //   this.pathService.getRecordingFile(dto.projectId),
    //   this.pathService.getVideoFile(dto.projectId),
    //   { overwrite: true }, // TODO getVideoFile does not longer exist
    // );

    // TODO change to correct duration
    const newDuration = this._getNewDuration(recordingTimestamps);

    await this.projectSerivce._updatePartial(dto.projectId, {
      duration: newDuration,
      status: ProjectStatus.LIVE,
      livestream: {
        recordingStatus: RecordingStatus.STOPPED,
        recordingTimestamps,
      },
    });

    return {};
  }

  _getNewDuration(recordingTimestamps: RecordingTimestamp[]) {
    // TODO

    let newDuration = 0;
    recordingTimestamps.forEach((record, index) => {
      if (index > 0 && record.type === RecordingTimestampType.STOP) {
        const lastRecord = recordingTimestamps[index - 1];
        newDuration += +record.timestamp - +lastRecord.timestamp;
      }
    });
    return newDuration;
  }

  async resumeRecording(
    authUser: AuthUser,
    dto: ResumeRecordingDto,
  ): Promise<ResumeRecordingEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (
      [
        RecordingStatus.NOT_STARTED,
        RecordingStatus.STOPPED,
        RecordingStatus.RECORDING,
      ].includes(project.livestream.recordingStatus)
    ) {
      throw new CustomBadRequestException('invalid_recording_status_change');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { recorder } = await this._getEndpoints(mediaPipelineId);

    await recorder.record();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      livestream: {
        recordingStatus: RecordingStatus.RECORDING,
        recordingTimestamps: [
          ...project.livestream.recordingTimestamps,
          { type: RecordingTimestampType.START, timestamp: new Date() },
        ],
      },
    });

    return {};
  }

  async pauseRecording(
    authUser: AuthUser,
    dto: PauseRecordingDto,
  ): Promise<PauseRecordingEntity> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);
    if (!this.permissions.isProjectOwner(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    if (
      [
        RecordingStatus.NOT_STARTED,
        RecordingStatus.STOPPED,
        RecordingStatus.PAUSED,
      ].includes(project.livestream.recordingStatus)
    ) {
      throw new CustomBadRequestException('invalid_recording_status_change');
    }

    const mediaPipelineId = await this._getPipelineIdOrThrow(project);
    const { recorder } = await this._getEndpoints(mediaPipelineId);

    await recorder.pause();

    await this.projectSerivce._updatePartial(dto.projectId, {
      status: ProjectStatus.LIVE,
      livestream: {
        recordingStatus: RecordingStatus.PAUSED,
        recordingTimestamps: [
          ...project.livestream.recordingTimestamps,
          { type: RecordingTimestampType.STOP, timestamp: new Date() },
        ],
      },
    });

    return {};
  }

  // UTILS

  private async _getPipelineIdOrThrow(project: LeanProjectDocument) {
    if (project.status !== ProjectStatus.LIVE) {
      throw new CustomForbiddenException('project_not_live');
    }

    const mediaPipelineId = project.livestream?.mediaPipelineId;
    if (!mediaPipelineId) {
      throw new CustomBadRequestException('stream_not_started');
    }

    return mediaPipelineId;
  }

  private async _getEndpoints(mediaPipelineId: string) {
    const pipeline = await this.client.getMediaobjectById<MediaPipeline>(
      mediaPipelineId,
    );

    const children = await pipeline.getChildren();

    const player = children.find((child) =>
      child.id.endsWith('PlayerEndpoint'),
    ) as PlayerEndpoint;

    const recorder = children.find((child) =>
      child.id.endsWith('RecorderEndpoint'),
    ) as RecorderEndpoint;

    const clients = children.filter((child) =>
      child.id.endsWith('WebRtcEndpoint'),
    ) as WebRtcEndpoint[];

    return { pipeline, player, recorder, clients };
  }
}
