import { Injectable } from '@nestjs/common';
import { parse } from '@plussub/srt-vtt-parser';
import { Entry } from '@plussub/srt-vtt-parser/dist/src/types';
import { readFile } from 'fs-extra';
import { Types } from 'mongoose';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { CaptionService } from '../../resources/caption/caption.service';
import { CreateCaptionDto } from '../../resources/caption/dto/create-caption.dto';
import { MediaFileMetadata } from '../media/media.interfaces';
import { PathService } from '../path/path.service';
import { WordEntity } from '../speech-to-text/speech-to-text.interfaces';
import { TiptapService } from '../tiptap/tiptap.service';

@Injectable()
export class ImportSubtitlesService {
  constructor(
    private pathService: PathService,
    private captionService: CaptionService,
    private tiptapService: TiptapService,
  ) {}

  async fromFile(
    authUser: AuthUser,
    file: MediaFileMetadata,
    transcriptionId: string,
    speakerId: string,
  ) {
    // TODO Read utf-16 file etc.
    const filePath = this.pathService.getUploadFile(
      file.uploadId,
      file.extension,
    );
    let content = await readFile(filePath, 'utf-8');
    content = content.replace(/^\uFEFF/gm, '').replace(/^\u00BB\u00BF/gm, ''); // remove BOM-tag from Utf-8-BOM

    try {
      if (file.filename.endsWith('json')) {
        await this.fromDeepspeechModel(
          content,
          speakerId,
          transcriptionId,
          authUser,
        );
      } else {
        const { entries } = parse(content);

        const splitted = entries.map((element: Entry) => {
          return element.text
            .split(' ')
            .filter((word) => word !== '')
            .map((word, i) => {
              const wordEntity: WordEntity = {
                text: word + ' ',
                start: element.from,
                end: element.to,
                startParagraph: i === 0,
                speakerId,
              };
              return wordEntity;
            });
        });
        const words = splitted.flat();

        const document = this.tiptapService.wordsToTiptap(words, speakerId);
        await this.tiptapService.updateDocument(transcriptionId, document);

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
