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
import { AuthUser } from '../auth/auth.interfaces';
import { LivekitAuthEntity } from './entities/livekit.entity';

@Injectable()
export class LivekitService {
  config = this.configService.get<LivekitConfig>('livekit');
  roomService: RoomServiceClient;
  egressClient: EgressClient;
  constructor(private configService: ConfigService, private db: DbService) {}

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

    if (rooms.length > 0) return;

    const opts = {
      name: projectId,
      emptyTimeout: 10 * 60, // 10*60 = 10 minutes
      maxParticipants: 10,
    };
    this.roomService.createRoom(opts).then((room) => {
      console.log('room created', room);

      //  recording of room
      // this.egressClient
      //   .startRoomCompositeEgress(projectId, {
      //     file: new EncodedFileOutput({
      //       fileType: EncodedFileType.MP4,
      //       filepath: './recordings/session.mp4',
      //     }),
      //   })
      //   .then((egress) => {
      //     console.log('egress started', egress);
      //   })
      //   .catch((err) => {
      //     console.log('egress error', err);
      //   });
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
