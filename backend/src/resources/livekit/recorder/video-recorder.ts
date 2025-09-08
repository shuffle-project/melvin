import * as livekitClient from '@livekit/rtc-node';
import { ChildProcess, spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { join } from 'path';
import { PathService } from 'src/modules/path/path.service';
import { Recorder } from './recorder';
export class VideoRecorder extends Recorder {
  private ffmpegProcess: ChildProcess | null = null;
  private isRecording = false;

  constructor(
    pathService: PathService,
    projectId: string,
    publication: livekitClient.RemoteTrackPublication,
  ) {
    super(pathService, projectId, publication);
  }

  getFilePath(): string {
    const filepath = join(
      this.pathService.getProjectDirectory(this.projectId),
      `${this.publication.track.sid}.mp4`,
    );
    console.log(filepath);
    return filepath;
  }

  async start() {
    this.isRecording = true;

    const videoStream = new livekitClient.VideoStream(this.publication.track);

    let counter = 1;
    for await (const event of videoStream) {
      if (!this.isRecording) {
        videoStream.close();
        return;
      }
      if (!event.frame) continue;

      if (this.ffmpegProcess == null) {
        const argsFffmpeg = [
          '-y', // overwrite output
          '-f',
          'rawvideo', // input format
          '-pix_fmt',
          'yuv420p', // input pixel format
          '-s',
          `${event.frame.width}x${event.frame.height}`, // input size
          '-r',
          '25', // input frame rate
          '-i',
          'pipe:0', // read from stdin
          '-c:v',
          'libx264', // encode with H.264
          '-preset',
          'fast', // encoding speed/quality tradeoff
          this.getFilePath(), // output file
        ];
        const argsGstreamer = [
          '-e',
          'fdsrc',
          '!',
          'videoparse',
          'format=i420',
          `width=${event.frame.width}`,
          `height=${event.frame.height}`,
          'framerate=25/1',
          '!',
          'videoconvert',
          '!',
          'videoscale',
          '!',
          'videorate',
          '!',
          'video/x-raw,format=I420,width=1280,height=720,framerate=25/1',
          '!',
          'x264enc',
          'speed-preset=fast',
          'tune=zerolatency',
          'key-int-max=25',
          '!',
          'h264parse',
          '!',
          'mp4mux',
          'faststart=true',
          '!',
          'filesink',
          `location=${this.getFilePath()}`,
        ];
        this.ffmpegProcess = spawn(ffmpegPath, argsFffmpeg);
        // this.ffmpegProcess = spawn('gst-launch-1.0', argsGstreamer);

        this.ffmpegProcess.on('message', (msg) => {
          console.log(msg);
        });

        this.ffmpegProcess.on('close', (code) => {
          console.log('close');
        });

        this.ffmpegProcess.on('error', (err) => {
          console.log('error', err);
        });
      }

      console.log(
        'frame',
        counter++,
        event.frame.data.length,
        `${event.frame.width}x${event.frame.height}`,
      );
      this.ffmpegProcess.stdin?.write(event.frame.data);
    }
  }

  async stop() {
    this.isRecording = false;
    if (!this.ffmpegProcess) return;

    this.ffmpegProcess.stdin?.end();
  }
}
