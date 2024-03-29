import { Injectable, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import { isSameObjectId } from '../../utils/objectid';
import { Caption } from '../db/schemas/caption.schema';
import { Transcription } from '../db/schemas/transcription.schema';
import { PathService } from '../path/path.service';

@Injectable()
export class ExportSubtitlesService {
  constructor(private pathService: PathService) {}

  toVttFile(transcription: Transcription, captions: Caption[]): StreamableFile {
    const lines = [];
    lines.push(`WEBVTT - ${transcription.title}`);
    // lines.push('Kind: captions');
    // lines.push(`Language: ${transcription.language}`);

    captions.forEach((caption, index) => {
      const formattedStart = this.formatTimestamp(caption.start, '.');
      const formattedEnd = this.formatTimestamp(caption.end, '.');
      const speakerName = transcription.speakers.find((speaker) =>
        isSameObjectId(speaker._id, caption.speakerId),
      ).name;

      lines.push('');
      lines.push(index + 1); // optional
      lines.push(`${formattedStart} --> ${formattedEnd}`);
      // lines.push(`<v ${speakerName}>${caption.text}`);
      lines.push(`${caption.text}`);
    });

    // Add empty new line to the end of the file for correct vtt parsing
    lines.push('');

    const stream = Readable.from(lines.join('\n'));
    return new StreamableFile(stream);
  }

  toSrtFile(transcription: Transcription, captions: Caption[]): StreamableFile {
    const lines = [];

    captions.forEach((caption, index) => {
      const formattedStart = this.formatTimestamp(caption.start, ',');
      const formattedEnd = this.formatTimestamp(caption.end, ',');

      if (index !== 0) lines.push('');
      lines.push(index + 1); // optional
      lines.push(`${formattedStart} --> ${formattedEnd}`);
      lines.push(`${caption.text}`);
    });

    const stream = Readable.from(lines.join('\n'));
    return new StreamableFile(stream);
  }

  private formatTimestamp(timeInMs: number, msSeperator: string): string {
    const date = new Date(0, 0, 0, 0, 0, 0, timeInMs);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    const milliseconds = ('00' + date.getMilliseconds()).slice(-3);
    return `${hours}:${minutes}:${seconds}${msSeperator}${milliseconds}`;
  }
}
