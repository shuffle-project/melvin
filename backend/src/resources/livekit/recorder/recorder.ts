import { PathService } from 'src/modules/path/path.service';

import * as livekitClient from '@livekit/rtc-node';

export abstract class Recorder {
  constructor(
    protected pathService: PathService,
    public projectId: string,
    protected publication: livekitClient.RemoteTrackPublication,
  ) {}

  abstract getFilePath(): string;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
