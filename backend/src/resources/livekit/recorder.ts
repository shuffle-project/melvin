import * as livekitClient from '@livekit/rtc-node';
import {
  closeSync,
  createWriteStream,
  openSync,
  statSync,
  WriteStream,
  writeSync,
} from 'fs';
import { join } from 'path';
import { PathService } from 'src/modules/path/path.service';
export class Recorder {
  private writer: WriteStream | null = null;
  private isRecording = false;

  constructor(
    private pathService: PathService,
    public projectId: string,
    private publication: livekitClient.RemoteTrackPublication,
  ) {}

  getFilePath(): string {
    const extension =
      this.publication.track?.kind === livekitClient.TrackKind.KIND_AUDIO
        ? 'wav'
        : 'yuv';

    const filepath = join(
      this.pathService.getProjectDirectory(this.projectId),
      `${this.publication.track.sid}.${extension}`,
    );
    console.log(filepath);
    return filepath;
  }

  async start() {
    this.isRecording = true;
    // https://github.com/livekit/node-sdks/blob/main/examples/receive-audio/index.ts
    switch (this.publication.track.kind) {
      case 1: // audio
        const audioStream = new livekitClient.AudioStream(
          this.publication.track,
        );

        for await (const frame of audioStream) {
          if (!this.isRecording) {
            audioStream.close();
            return;
          }

          if (this.writer === null) {
            this.writer = createWriteStream(this.getFilePath());
            this.writeWavHeader(this.writer, frame);
          }

          this.writer.write(Buffer.from(frame.data.buffer));
        }

        break;
      case 2: // Video
        const videoStream = new livekitClient.VideoStream(
          this.publication.track,
        );

        let counter = 1;
        for await (const event of videoStream) {
          if (!this.isRecording) {
            videoStream.close();
            return;
          }
          if (!event.frame) continue;

          if (this.writer == null) {
            this.writer = createWriteStream(this.getFilePath());
          }

          console.log(
            'frame',
            counter++,
            event.frame.data.length,
            `${event.frame.width}x${event.frame.height}`,
          );
          this.writer.write(event.frame.data);
        }

        break;

      default:
        break;
    }
  }

  stop(): void {
    this.isRecording = false;
    if (!this.writer) return;

    this.writer.close();

    switch (this.publication.track.kind) {
      case 1: // audio
        this.updateWavHeader(this.getFilePath());
        break;
      case 2: // Video
        // do nothing -> ffmpeg
        break;
      default:
        break;
    }
  }

  // Constants for WAV file
  BITS_PER_SAMPLE = 16;

  writeWavHeader(writer: WriteStream, frame: livekitClient.AudioFrame) {
    const header = Buffer.alloc(44);
    const byteRate =
      (frame.sampleRate * frame.channels * this.BITS_PER_SAMPLE) / 8;
    const blockAlign = (frame.channels * this.BITS_PER_SAMPLE) / 8;

    // Write the RIFF header
    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(0, 4); // ChunkSize placeholder
    header.write('WAVE', 8); // Format

    // Write the fmt subchunk
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (PCM = 1)
    header.writeUInt16LE(frame.channels, 22); // NumChannels
    header.writeUInt32LE(frame.sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample

    // Write the data subchunk
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(0, 40); // Subchunk2Size placeholder

    // Write the header to the stream
    writer.write(header);
  }

  updateWavHeader(path: string) {
    // Update the size of the audio data in the header
    const stats = statSync(path);
    const fileSize = stats.size;

    const chunkSize = fileSize - 8;
    const subchunk2Size = fileSize - 44;
    const header = Buffer.alloc(8);
    header.writeUInt32LE(chunkSize, 0);
    header.writeUInt32LE(subchunk2Size, 4);

    // Reopen the file for updating the header
    const fd = openSync(path, 'r+');
    writeSync(fd, header, 0, 4, 4); // Update ChunkSize
    writeSync(fd, header, 4, 4, 40); // Update Subchunk2Size
    closeSync(fd);
  }
}
