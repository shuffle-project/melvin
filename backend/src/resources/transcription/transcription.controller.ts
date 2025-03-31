import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { TiptapCaption } from '../../modules/tiptap/tiptap.interfaces';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSpeakersDto } from './dto/create-speakers.dto';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { DownloadSubtitlesQuery } from './dto/download-subtitles.dto';
import { FindAllTranscriptionsQuery } from './dto/find-all-transcriptions.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { TranscriptionEntity } from './entities/transcription.entity';
import { TranscriptionService } from './transcription.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('transcriptions')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  // @UseInterceptors(SubtitleFileInterceptor)
  @ApiResponse({ status: HttpStatus.CREATED, type: TranscriptionEntity })
  create(
    @User() authUser: AuthUser,
    @Body() createTranscriptionDto: CreateTranscriptionDto,
    // @UploadedFile() file?: Express.Multer.File, //TODO swagger
  ): Promise<TranscriptionEntity> {
    return this.transcriptionService.create(authUser, createTranscriptionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: [TranscriptionEntity] })
  findAll(
    @User() authUser: AuthUser,
    @Query() query: FindAllTranscriptionsQuery,
  ): Promise<TranscriptionEntity[]> {
    return this.transcriptionService.findAll(authUser, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  findOne(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<TranscriptionEntity> {
    return this.transcriptionService.findOne(authUser, id);
  }

  @Get(':id/getCaptions')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  getCaptions(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<TiptapCaption[]> {
    return this.transcriptionService.getCaptions(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  update(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() updateTranscriptionDto: UpdateTranscriptionDto,
  ): Promise<TranscriptionEntity> {
    return this.transcriptionService.update(
      authUser,
      id,
      updateTranscriptionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  remove(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<void> {
    return this.transcriptionService.remove(authUser, id);
  }

  @Get(':id/downloadSubtitles')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK })
  downloadSubtitles(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Query() query: DownloadSubtitlesQuery,
  ): Promise<StreamableFile> {
    return this.transcriptionService.downloadSubtitles(authUser, id, query);
  }

  // speakers

  @Post(':id/speakers')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.CREATED, type: TranscriptionEntity })
  createSpeakers(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() createSpeakersDto: CreateSpeakersDto,
  ): Promise<TranscriptionEntity> {
    return this.transcriptionService.createSpeakers(
      authUser,
      id,
      createSpeakersDto,
    );
  }

  @Patch(':id/speakers/:idSpeaker')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  updateSpeaker(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Param('idSpeaker', IsValidObjectIdPipe) idSpeaker: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
  ) {
    return this.transcriptionService.updateSpeaker(
      authUser,
      id,
      idSpeaker,
      updateSpeakerDto,
    );
  }

  @Delete(':transcriptionId/speakers/:speakerId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  removeSpeaker(
    @User() authUser: AuthUser,
    @Param('transcriptionId', IsValidObjectIdPipe) transcriptionId: string,
    @Param('speakerId', IsValidObjectIdPipe) speakerId: string,
  ) {
    return this.transcriptionService.removeSpeaker(
      authUser,
      transcriptionId,
      speakerId,
    );
  }

  // Align transcription

  @Patch(':id/align')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TranscriptionEntity })
  alignTranscription(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ) {
    return this.transcriptionService.alignTranscription(authUser, id);
  }
}
