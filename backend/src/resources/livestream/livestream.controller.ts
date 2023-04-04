import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectLivestreamDto } from './dto/connect-stream.dto';
import { PauseRecordingDto } from './dto/pause-recording.dto';
import { PauseLivestreamDto } from './dto/pause-stream.dto';
import { ResumeRecordingDto } from './dto/resume-recording.dto';
import { ResumeLivestreamDto } from './dto/resume-stream.dto';
import { StartRecordingDto } from './dto/start-recording.dto';
import { StartLivestreamDto } from './dto/start-stream.dto';
import { StopRecordingDto } from './dto/stop-recording.dto';
import { StopLivestreamDto } from './dto/stop-stream.dto';
import { ConnectLivestreamEntity } from './entities/connect-stream.entity';
import { PauseRecordingEntity } from './entities/pause-recording.entity';
import { PauseLivestreamEntity } from './entities/pause-stream.entity';
import { ResumeRecordingEntity } from './entities/resume-recording.entity';
import { ResumeLivestreamEntity } from './entities/resume-stream.entity';
import { StartRecordingEntity } from './entities/start-recording.entity';
import { StartLivestreamEntity } from './entities/start-stream.entity';
import { StopRecordingEntity } from './entities/stop-recording.entity';
import { StopLivestreamEntity } from './entities/stop-stream.entity';
import { LivestreamService } from './livestream.service';

@Controller('livestreams')
export class LivestreamController {
  constructor(private readonly livestreamService: LivestreamService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/connect')
  @ApiResponse({ status: HttpStatus.OK, type: ConnectLivestreamEntity })
  async connect(
    @User() authUser: AuthUser,
    @Body() connectLivestreamDto: ConnectLivestreamDto,
  ): Promise<ConnectLivestreamEntity> {
    return this.livestreamService.connect(authUser, connectLivestreamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/start')
  @ApiResponse({ status: HttpStatus.OK, type: StartLivestreamEntity })
  async start(
    @User() authUser: AuthUser,
    @Body() startLivestreamDto: StartLivestreamDto,
  ): Promise<StartLivestreamEntity> {
    return this.livestreamService.start(authUser, startLivestreamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/pause')
  @ApiResponse({ status: HttpStatus.OK, type: PauseLivestreamEntity })
  async pause(
    @User() authUser: AuthUser,
    @Body() pauseLivestreamDto: PauseLivestreamDto,
  ): Promise<PauseLivestreamEntity> {
    return this.livestreamService.pause(authUser, pauseLivestreamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/resume')
  @ApiResponse({ status: HttpStatus.OK, type: ResumeLivestreamEntity })
  async resume(
    @User() authUser: AuthUser,
    @Body() resumeLivestreamDto: ResumeLivestreamDto,
  ): Promise<ResumeLivestreamEntity> {
    return this.livestreamService.resume(authUser, resumeLivestreamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/stop')
  @ApiResponse({ status: HttpStatus.OK, type: StopLivestreamEntity })
  async stop(
    @User() authUser: AuthUser,
    @Body() stopLivestreamDto: StopLivestreamDto,
  ): Promise<StopLivestreamEntity> {
    return this.livestreamService.stop(authUser, stopLivestreamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/startRecording')
  @ApiResponse({ status: HttpStatus.OK, type: StartRecordingEntity })
  async startRecording(
    @User() authUser: AuthUser,
    @Body() startRecordingDto: StartRecordingDto,
  ): Promise<StartRecordingEntity> {
    return this.livestreamService.startRecording(authUser, startRecordingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/stopRecording')
  @ApiResponse({ status: HttpStatus.OK, type: StopRecordingEntity })
  async stopRecording(
    @User() authUser: AuthUser,
    @Body() stopRecordingDto: StopRecordingDto,
  ): Promise<StopRecordingEntity> {
    return this.livestreamService.stopRecording(authUser, stopRecordingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/pauseRecording')
  @ApiResponse({ status: HttpStatus.OK, type: PauseRecordingEntity })
  async pauseRecording(
    @User() authUser: AuthUser,
    @Body() pauseRecordingDto: PauseRecordingDto,
  ): Promise<PauseRecordingEntity> {
    return this.livestreamService.pauseRecording(authUser, pauseRecordingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/resumeRecording')
  @ApiResponse({ status: HttpStatus.OK, type: ResumeRecordingEntity })
  async resumeRecording(
    @User() authUser: AuthUser,
    @Body() resumeRecordingDto: ResumeRecordingDto,
  ): Promise<ResumeRecordingEntity> {
    return this.livestreamService.resumeRecording(authUser, resumeRecordingDto);
  }
}
