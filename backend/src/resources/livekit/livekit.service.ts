import { AutoSubscribe, defineAgent, JobContext } from '@livekit/agents';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, VideoGrant } from 'livekit-server-sdk';
import { LivekitConfig } from 'src/config/config.interface';
import { AuthUser } from '../auth/auth.interfaces';
import { LivekitAuthEntity } from './entities/livekit.entity';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect(
      // setting end-to-end encryption options to undefined uses the defaults
      undefined,
      // valid values are SUBSCRIBE_ALL, SUBSCRIBE_NONE, VIDEO_ONLY, AUDIO_ONLY
      // when omitted, it defaults to SUBSCRIBE_ALL
      AutoSubscribe.SUBSCRIBE_ALL,
    );
  },
});

@Injectable()
export class LivekitService {
  config = this.configService.get<LivekitConfig>('livekit');

  constructor(private configService: ConfigService) {
    const roomService = new RoomServiceClient(
      this.config.url,
      this.config.apikey,
      this.config.secret,
    );
    setInterval(() => {
      roomService.listRooms().then((rooms) => {
        console.log(rooms);
      });
    }, 10000);
  }

  public async getToken(
    authUser: AuthUser,
    projectId: string,
  ): Promise<LivekitAuthEntity> {
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
