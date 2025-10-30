import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TranscriptionModule } from '../../resources/transcription/transcription.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { MelvinAsrApiModule } from '../melvin-asr-api/melvin-asr-api.module';
import { PathModule } from '../path/path.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { AssemblyAiService } from './assemblyai/assemblyai.service';
import { GoogleSpeechService } from './google-speech/google-speech.service';
import { SpeechToTextService } from './speech-to-text.service';
import { WhisperSpeechService } from './whisper/whisper-speech.service';

@Module({
  imports: [
    LoggerModule,
    DbModule,
    PathModule,
    HttpModule.register({}),
    TranscriptionModule,
    TiptapModule,
    MelvinAsrApiModule,
    BullModule.registerQueue({
      name: 'melvinAsr',
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    }),
  ],
  controllers: [],
  providers: [
    SpeechToTextService,
    AssemblyAiService,
    GoogleSpeechService,
    WhisperSpeechService,
  ],
  exports: [SpeechToTextService, WhisperSpeechService],
})
export class SpeechToTextModule {}
