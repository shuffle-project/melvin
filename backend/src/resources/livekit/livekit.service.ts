import * as livekitClient from '@livekit/rtc-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  EgressClient,
  RoomServiceClient,
  VideoGrant,
} from 'livekit-server-sdk';
import { LivekitConfig } from 'src/config/config.interface';
import { DbService } from 'src/modules/db/db.service';
import { ProjectStatus } from 'src/modules/db/schemas/project.schema';
import { TiptapService } from 'src/modules/tiptap/tiptap.service';
import { AuthUser } from '../auth/auth.interfaces';
import { UserService } from '../user/user.service';
import { LivekitAuthEntity } from './entities/livekit.entity';

@Injectable()
export class LivekitService {
  config = this.configService.get<LivekitConfig>('livekit');
  roomService: RoomServiceClient;
  egressClient: EgressClient;
  constructor(
    private configService: ConfigService,
    private db: DbService,
    private userService: UserService,
    private tiptapService: TiptapService,
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

  async createRoom(projectId: string) {
    const rooms = await this.roomService.listRooms([projectId]);

    const project = await this.db.projectModel.findById(projectId);

    if (rooms.length > 0) return;

    const opts = {
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

      const systemUser = await this.userService.findSystemUser();
      const livekitAuthEntity = await this.authenticate(
        { role: systemUser.role, id: systemUser._id.toString(), jwtId: '' },
        projectId,
      );

      const livekitClientRoom = new livekitClient.Room();
      livekitClientRoom.on('participantConnected', (participant) => {
        console.log(`Participant connected: ${participant.identity}`);
      });

      livekitClientRoom.on('participantDisconnected', (participant) => {
        console.log(`Participant disconnected: ${participant.identity}`);
      });

      livekitClientRoom.on('chatMessage', (message) => {
        console.log('chat message', message);
      });
      livekitClientRoom.on('dataReceived', (data) => {
        console.log('data received', data);
      });

      livekitClientRoom.on('trackPublished', (track, participant) => {
        console.log(
          `Track published: ${track.kind} by ${participant.identity}, trackSid: ${track.sid}`,
        );
        switch (track.kind) {
          //   KIND_AUDIO = 1,
          //   KIND_VIDEO = 2,
          case 1:
            // const audioStream = new livekitClient.AudioStream(track as any);

            break;
          case 2:
            // const videoStream = new livekitClient.VideoStream(track as any);
            // console.log(videoStream);
            break;
          default:
            break;
        }
        console.log(track);
      });

      await livekitClientRoom.connect(
        livekitAuthEntity.url,
        livekitAuthEntity.authToken,
      );

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
    await this.createRoom(projectId);
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
