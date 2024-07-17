import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PopulateModule } from '../../resources/populate/populate.module';
import { TranscriptionModule } from '../../resources/transcription/transcription.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { AssemblyAiService } from './assemblyai/assemblyai.service';
import { GoogleSpeechService } from './google-speech/google-speech.service';
import { SpeechToTextService } from './speech-to-text.service';
import { WhisperSpeechService } from './whisper/whisper-speech.service';

@Module({
  imports: [
    LoggerModule,
    PopulateModule,
    DbModule,
    PathModule,
    HttpModule.register({}),
    TranscriptionModule,
    TiptapModule,
  ],
  controllers: [],
  providers: [
    SpeechToTextService,
    AssemblyAiService,
    GoogleSpeechService,
    WhisperSpeechService,
  ],
  exports: [SpeechToTextService],
})
export class SpeechToTextModule {}
