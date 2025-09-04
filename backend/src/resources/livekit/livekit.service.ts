import { initializeLogger } from '@livekit/agents';
import * as livekitClient from '@livekit/rtc-node';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { rename, writeFile } from 'fs/promises';
import {
  AccessToken,
  CreateOptions,
  EgressClient,
  RoomServiceClient,
  VideoGrant,
} from 'livekit-server-sdk';
import { Types } from 'mongoose';
import { LivekitConfig } from 'src/config/config.interface';
import { DbService } from 'src/modules/db/db.service';
import {
  Audio,
  MediaCategory,
  MediaStatus,
  ProjectStatus,
  Video,
} from 'src/modules/db/schemas/project.schema';
import { WaveformData } from 'src/modules/ffmpeg/ffmpeg.interfaces';
import { FfmpegService } from 'src/modules/ffmpeg/ffmpeg.service';
import { PathService } from 'src/modules/path/path.service';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { ProcessVideoJob } from 'src/processors/processor.interfaces';
import { AuthUser } from '../auth/auth.interfaces';
import { UserService } from '../user/user.service';
import { LivekitAuthEntity } from './entities/livekit.entity';
import { AudioRecorder } from './recorder/audio-recorder';
import { Recorder } from './recorder/recorder';
import { VideoRecorder } from './recorder/video-recorder';

@Injectable()
export class LivekitService {
  config = this.configService.get<LivekitConfig>('livekit');
  roomService: RoomServiceClient;
  egressClient: EgressClient;

  recorders: Recorder[] = [];

  constructor(
    private configService: ConfigService,
    private db: DbService,
    private userService: UserService,
    private tiptapService: TiptapService,
    private pathService: PathService,
    @InjectQueue('video')
    private videoQueue: Queue<ProcessVideoJob>,
    private ffmpegService: FfmpegService,
  ) {}

  // opts = new WorkerOptions({
  //   // path to a file that has a default export of defineAgent, dynamically
  //   // imported later for entrypoint and prewarm functions
  //   agent: './agent',
  //   // inspect the request and decide if the current worker should handle it.
  //   // requestFunc,
  //   // a function that reports the current system load, whether CPU or RAM, etc.
  //   // loadFunc,
  //   // the maximum value of loadFunc, above which new processes will not spawn
  //   // loadThreshold,
  //   // whether the agent can subscribe to tracks, publish data, update metadata, etc.
  //   // permissions,
  //   // the type of worker to create, either JT_ROOM or JT_PUBLISHER
  //   // workerType = JobType.JT_ROOM,
  // });

  async onApplicationBootstrap(): Promise<void> {
    this.roomService = new RoomServiceClient(
      this.config.url,
      this.config.apikey,
      this.config.secret,
    );

    this.egressClient = new EgressClient(
      this.config.url,
      this.config.apikey,
      this.config.secret,
    );

    initializeLogger({ pretty: true, level: 'debug' });

    // cli.runApp(optsno);
    // setInterval(() => {
    //   roomService.listRooms().then((rooms) => {
    //     console.log(rooms);
    //   });
    // }, 10000);

    /**
     *
     */
  }

  async startRecording(authUser: AuthUser, projectId: string) {
    // TODO check authuser
    const rooms = await this.roomService.listRooms([projectId]);

    if (rooms.length < 1) {
      throw new Error('No livekit room found for project');
    }

    const systemUser = await this.userService.findSystemUser();
    const livekitAuthEntity = await this.authenticate(
      { role: systemUser.role, id: systemUser._id.toString(), jwtId: '' },
      projectId,
    );

    const livekitClientRoom = new livekitClient.Room();
    livekitClientRoom.on(
      'trackSubscribed',
      (track, publication, participant) => {
        console.log('subscribed to track', track.kind, participant.identity);
        if (!publication.track) return;
        const trackRecorder =
          publication.kind === livekitClient.TrackKind.KIND_AUDIO
            ? new AudioRecorder(this.pathService, projectId, publication)
            : new VideoRecorder(this.pathService, projectId, publication);
        this.recorders.push(trackRecorder);
        trackRecorder.start();
      },
    );

    await livekitClientRoom.connect(
      livekitAuthEntity.url,
      livekitAuthEntity.authToken,
    );

    // livekitClientRoom.remoteParticipants.forEach((participant) => {
    //   participant.trackPublications.forEach((publication) => {
    //     // console.log('setSubscribed true');
    //     // publication.setSubscribed(true);
    //     console.log(publication.track);

    //     if (!publication.track) return;
    //     const trackRecorder = new Recorder(
    //       this.pathService,
    //       projectId,
    //       publication,
    //     );
    //     this.recorders.push(trackRecorder);
    //     trackRecorder.start();
    //   });
    // });
  }

  async stopRecording(authUser: AuthUser, projectId: string) {
    // TODO check authuser
    this.recorders
      .filter((recorder) => recorder.projectId === projectId)
      .forEach((recorder) => recorder.stop());

    const projectRecorders = this.recorders.filter(
      (recorder) => recorder.projectId === projectId,
    );

    const files = projectRecorders.map((recorder) => recorder.getFilePath());
    const audioPaths = files.filter((file) => file.endsWith('.wav'));
    const videoPaths = files.filter((file) => file.endsWith('.mp4'));

    const videoEntities: Video[] = videoPaths.map((path, i) => ({
      category: i === 1 ? MediaCategory.MAIN : MediaCategory.OTHER, // TODO
      title: '',
      _id: new Types.ObjectId(),
      originalFileName: path.split('/').pop(),
      status: MediaStatus.WAITING,
      extension: 'mp4',
      resolutions: [],
    }));

    const audioEntity: Audio = {
      title: '',
      _id: new Types.ObjectId(),
      originalFileName: audioPaths[0].split('/').pop(),
      status: MediaStatus.WAITING,
      extension: 'mp3',
      category: MediaCategory.MAIN,
    };

    await this.db.updateProjectByIdAndReturn(projectId, {
      $push: {
        videos: { $each: videoEntities },
      },
    });
    await this.db.updateProjectByIdAndReturn(projectId, {
      $push: {
        audios: audioEntity,
      },
    });

    videoEntities.forEach(async (video, i) => {
      console.log('add to video queue', video);

      const baseMediaFile = this.pathService.getBaseMediaFile(projectId, video);
      await rename(videoPaths[i], baseMediaFile);
      this.videoQueue.add({
        projectId,
        video,
        skipLowestResolution: false,
      });
    });

    //get duration via ffprobe
    const duration = await this.ffmpegService.getVideoDurationByPath(
      this.pathService.getBaseMediaFile(projectId, videoEntities[0]),
    );

    // set duration in project
    await this.db.projectModel.findByIdAndUpdate(projectId, {
      $set: { duration },
    });

    // await this.db.projectModel.findByIdAndUpdate(projectId, {});
    console.log(audioPaths[0], audioEntity);
    // audios
    await this.ffmpegService.createMp3File(
      projectId,
      audioPaths[0],
      audioEntity,
    );

    await this.generateWaveformData(projectId, audioEntity);

    // videos
    // move video to getBaseMediaFile
    // add video to project

    // general
    // get duration via ffprobe
    // set duration in project

    console.log(files);
    // TODO process video with these files

    await this.db.updateProjectByIdAndReturn(projectId, {
      $set: { status: ProjectStatus.DRAFT },
    });

    // remove recorders from list
    this.recorders = this.recorders.filter(
      (recorder) => recorder.projectId !== projectId,
    );
  }

  // TODO thats code duplication, copied from project.processor.ts
  async generateWaveformData(projectId: string, audio: Audio) {
    const waveformPath = this.pathService.getWaveformFile(projectId, audio);

    const generatedData: WaveformData =
      await this.ffmpegService.getWaveformData(projectId, audio);

    await writeFile(waveformPath, JSON.stringify(generatedData));
  }

  async createRoom(projectId: string) {
    const rooms = await this.roomService.listRooms([projectId]);

    const project = await this.db.projectModel.findById(projectId);

    if (rooms.length > 0) return;

    const opts: CreateOptions = {
      name: projectId,
      emptyTimeout: 10 * 60, // 10*60 = 10 minutes
      maxParticipants: 10,
    };

    this.roomService.createRoom(opts).then(async (room) => {
      console.log('room created', room);

      let iterations = 0;
      let interval = setInterval(() => {
        iterations++;
        this.tiptapService.insert(
          project.transcriptions[0]._id.toString(),
          'hallo test 123',
        );
        if (iterations > 20) clearInterval(interval);
      }, 5000);
    });
  }

  async createRoomLegacy(projectId: string) {
    const rooms = await this.roomService.listRooms([projectId]);

    const project = await this.db.projectModel.findById(projectId);

    if (rooms.length > 0) return;

    const opts: CreateOptions = {
      name: projectId,
      emptyTimeout: 10 * 60, // 10*60 = 10 minutes
      maxParticipants: 10,
    };

    this.roomService.createRoom(opts).then(async (room) => {
      console.log('room created', room);

      let iterations = 0;
      let interval = setInterval(() => {
        iterations++;
        this.tiptapService.insert(
          project.transcriptions[0]._id.toString(),
          'hallo test 123',
        );
        if (iterations > 20) clearInterval(interval);
      }, 5000);

      // livekitClientRoom.connect()

      // // Local path inside the egress worker's filesystem
      // const outputFile = new EncodedFileOutput({
      //   fileType: EncodedFileType.MP4,
      //   filepath:
      //     '/recordings/' +
      //     room.sid +
      //     '-' +
      //     new Date().getMilliseconds() +
      //     '.mp4', // absolute path is recommended
      // });

      // const opts: RoomCompositeOptions = {
      //   layout: 'grid',
      //   audioOnly: false,
      //   videoOnly: false,
      // };

      // //  recording of room
      // try {
      //   const egress = await this.egressClient.startRoomCompositeEgress(
      //     projectId,
      //     outputFile,
      //     opts,
      //   );

      //   console.log('egress started', egress.egressId);
      //   console.log(egress);
      // } catch (e: any) {
      //   console.error(
      //     'egress error',
      //     e?.response?.status,
      //     e?.response?.data || e?.message,
      //   );
      // }
    });
  }

  async deleteRoom(projectId: string) {
    this.roomService.deleteRoom(projectId).then(() => {
      console.log('room deleted');
    });
  }

  public async authenticate(
    authUser: AuthUser,
    projectId: string,
  ): Promise<LivekitAuthEntity> {
    // await this.createRoomLegacy(projectId);

    this.createRoom(projectId);

    await this.db.projectModel.findByIdAndUpdate(projectId, {
      $set: { status: ProjectStatus.LIVE },
    });

    const at = new AccessToken(this.config.apikey, this.config.secret, {
      identity: authUser.id,
    });

    const videoGrant: VideoGrant = {
      room: projectId,
      roomJoin: true,
      canPublish: true, // if projectowner = true  : false
      canSubscribe: true, // if projectMember = true
    };

    at.addGrant(videoGrant);
    const authToken = await at.toJwt();
    console.log('authToken for:', authUser, projectId);

    return { url: this.config.url, authToken };
  }

  public async authenticateViewer(
    authUser: AuthUser,
    viewerToken: string,
  ): Promise<LivekitAuthEntity> {
    const project = await this.db.projectModel.findOne({ viewerToken });

    // TODO add checks to project

    const at = new AccessToken(this.config.apikey, this.config.secret, {
      identity: authUser.id,
    });

    const videoGrant: VideoGrant = {
      room: project._id.toString(),
      roomJoin: true,
      canPublish: false, // if projectowner = true  : false
      canSubscribe: true, // if projectMember = true
    };

    at.addGrant(videoGrant);
    const authToken = await at.toJwt();
    console.log('authToken for:', authUser, viewerToken);

    return { url: this.config.url, authToken };
  }
}
