import { WorkerOptions } from '@livekit/agents';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, VideoGrant } from 'livekit-server-sdk';
import { LivekitConfig } from 'src/config/config.interface';
import { AuthUser } from '../auth/auth.interfaces';
import { LivekitAuthEntity } from './entities/livekit.entity';

const opts = new WorkerOptions({
  // path to a file that has a default export of defineAgent, dynamically
  // imported later for entrypoint and prewarm functions
  agent: './agent',
  // inspect the request and decide if the current worker should handle it.
  // requestFunc,
  // a function that reports the current system load, whether CPU or RAM, etc.
  // loadFunc,
  // the maximum value of loadFunc, above which new processes will not spawn
  // loadThreshold,
  // whether the agent can subscribe to tracks, publish data, update metadata, etc.
  // permissions,
  // the type of worker to create, either JT_ROOM or JT_PUBLISHER
  // workerType = JobType.JT_ROOM,
});
@Injectable()
export class LivekitService {
  config = this.configService.get<LivekitConfig>('livekit');
  roomService: RoomServiceClient;

  constructor(private configService: ConfigService) {}

  async onApplicationBootstrap(): Promise<void> {
    this.roomService = new RoomServiceClient(
      this.config.url,
      this.config.apikey,
      this.config.secret,
    );

    // cli.runApp(opts);
    // setInterval(() => {
    //   roomService.listRooms().then((rooms) => {
    //     console.log(rooms);
    //   });
    // }, 10000);

    /**
     *
     */

    // // though `production` is defined in WorkerOptions, it will always be overriddden by CLI.
    // const { production: _, ...opts } = args.opts; // eslint-disable-line @typescript-eslint/no-unused-vars
    // const worker = new Worker(new WorkerOptions({ production: args.production, ...opts }));

    // if (args.room) {
    //   worker.event.once('worker_registered', () => {
    //     logger.info(`connecting to room ${args.room}`);
    //     worker.simulateJob(args.room!, args.participantIdentity);
    //   });
    // }

    // process.once('SIGINT', async () => {
    //   // allow C-c C-c for force interrupt
    //   process.once('SIGINT', () => {
    //     logger.info('worker closed forcefully');
    //     process.exit(130); // SIGINT exit code
    //   });
    //   if (args.production) {
    //     await worker.drain();
    //   }
    //   await worker.close();
    //   logger.info('worker closed');
    //   process.exit(130); // SIGINT exit code
    // });

    // try {
    //   await worker.run();
    // } catch {
    //   logger.fatal('worker failed');
    //   process.exit(1);
    // }
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

    // TODO check if user is allwed to join this project room
    // getProject
    // is owner
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
}
