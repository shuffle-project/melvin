import { Injectable } from '@nestjs/common';
import { parse } from '@plussub/srt-vtt-parser';
import { Entry } from '@plussub/srt-vtt-parser/dist/src/types';
import { readFile } from 'fs-extra';
import { Types } from 'mongoose';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { CaptionService } from '../../resources/caption/caption.service';
import { CreateCaptionDto } from '../../resources/caption/dto/create-caption.dto';
import { PathService } from '../path/path.service';

@Injectable()
export class ImportSubtitlesService {
  constructor(
    private pathService: PathService,
    private captionService: CaptionService,
  ) {}

  async fromFile(
    authUser: AuthUser,
    file: Express.Multer.File,
    transcriptionId: string,
    speakerId: string,
  ) {
    // TODO Read utf-16 file etc.
    let content = await readFile(file.path, 'utf-8');
    content = content.replace(/^\uFEFF/gm, '').replace(/^\u00BB\u00BF/gm, ''); // remove BOM-tag from Utf-8-BOM

    try {
      if (file.originalname.endsWith('json')) {
        await this.fromDeepspeechModel(
          content,
          speakerId,
          transcriptionId,
          authUser,
        );
      } else {
        const { entries } = parse(content);

        await Promise.all(
          entries.map((element: Entry) =>
            this.captionService.create(authUser, {
              end: element.to,
              speakerId,
              start: element.from,
              text: element.text,
              transcription: new Types.ObjectId(transcriptionId),
            }),
          ),
        );
      }
    } catch (error: any) {
      console.log(error);
    }
  }

  private async fromDeepspeechModel(
    content: string,
    speakerId: string,
    transcriptionId: string,
    authUser: AuthUser,
  ) {
    const data: {
      transcripts: {
        confidence: number;
        words: { word: string; start_time: number; duration: number }[];
      }[];
    } = JSON.parse(content);
    const dtos: CreateCaptionDto[] = [];
    let text = '';
    let lastStart = 0;
    data.transcripts[0].words.forEach((word) => {
      if (lastStart + 6 > word.start_time) {
        text = text + ' ' + word.word;
      } else {
        dtos.push({
          start: lastStart * 1000,
          end: word.start_time * 1000,
          speakerId,
          text,
          transcription: new Types.ObjectId(transcriptionId),
        });
        lastStart = word.start_time;
        text = word.word + '';
      }
    });

    await Promise.all(
      dtos.map((dto) => this.captionService.create(authUser, dto)),
    );
  }

  fromVtt(lines: string[]) {
    console.log(lines);
  }

  fromSrt(lines: string[]) {
    console.log(lines);
  }
}
