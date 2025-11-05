import { Injectable } from '@nestjs/common';
import { parse } from '@plussub/srt-vtt-parser';
import { Entry } from '@plussub/srt-vtt-parser/dist/src/types';
import { readFile } from 'fs-extra';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';
import { WordEntity } from '../speech-to-text/speech-to-text.interfaces';
import { TiptapService } from '../tiptap/tiptap.service';
import { UploadMetadata } from '../upload/upload.interfaces';

@Injectable()
export class ImportSubtitlesService {
  constructor(
    private pathService: PathService,
    private tiptapService: TiptapService,
    private logger: CustomLogger,
  ) {}

  async fromFile(
    authUser: AuthUser,
    file: UploadMetadata,
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
      }
    } catch (error: any) {
      this.logger.error(error);
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

    const words: WordEntity[] = data.transcripts[0].words.map((word) => {
      return {
        text: word.word,
        start: word.start_time,
        end: word.start_time + word.duration,
        speakerId: null,
        startParagraph: false,
      };
    });
    const document = this.tiptapService.wordsToTiptap(words, speakerId);
    await this.tiptapService.updateDocument(transcriptionId, document);
  }

  fromVtt(lines: string[]) {
    console.log(lines);
  }

  fromSrt(lines: string[]) {
    console.log(lines);
  }
}
