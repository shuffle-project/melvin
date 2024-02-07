import { HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
import { environment } from '../../../environments/environment';
import { BulkRemoveDto } from './dto/bulk-remove.dto';
import { ConnectLivestreamDto } from './dto/connect-livestream.dto';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { CreateSpeakersDto } from './dto/create-speakers.dto';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { PauseLivestreamDto } from './dto/pause-livestream.dto';
import { PauseRecordingDto } from './dto/pause-recording,dto';
import { ResumeLivestreamDto } from './dto/resume-livestream.dto';
import { ResumeRecordingDto } from './dto/resume-recording.dto';
import { StartLivestreamDto } from './dto/start-livestream.dto';
import { StartRecordingDto } from './dto/start-recording.dto';
import { StopLivestreamDto } from './dto/stop-livestream.dto';
import { StopRecordingDto } from './dto/stop-recording.dto';
import { UpdateCaptionDto } from './dto/update-caption.dto';
import {
  UpdateManyNotificationsDto,
  UpdateNotificationDto,
} from './dto/update-notification.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ActivityListEntity } from './entities/activitiy-list.entity';
import { GuestLoginEntity, InviteEntity } from './entities/auth.entity';
import { CaptionListEntity } from './entities/caption-list.entity';
import { CaptionEntity, CaptionHistoryEntity } from './entities/caption.entity';
import { ConfigEntity } from './entities/config.entity';
import { ConnectLivestreamEntity } from './entities/connect-livestream.entity';
import { NotificationListEntity } from './entities/notification-list.entity';
import { NotificationEntity } from './entities/notification.entity';
import { PauseLivestreamEntity } from './entities/pause-livestream.entity';
import { PauseRecordingEntity } from './entities/pause-recording,entity';
import { ProjectInviteTokenEntity } from './entities/project-invite-token.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { ProjectEntity, ProjectMediaEntity } from './entities/project.entity';
import { ResumeLivestreamEntity } from './entities/resume-livestream.entity';
import { ResumeRecordingEntity } from './entities/resume-recording';
import { StartLivestreamEntity } from './entities/start-livestream.entity';
import { StartRecordingEntity } from './entities/start-recording.entity';
import { StopLivestreamEntity } from './entities/stop-livestream.entity';
import { StopRecordingEntity } from './entities/stop-recording.entity';
import { TranscriptionEntity } from './entities/transcription.entity';
import { WaveformData } from './entities/waveform-data.entity';
import { FakeApiService } from './fake-api.service';
import { RealApiService } from './real-api.service';

@Injectable({
  providedIn: 'root',
  useClass: !environment.baseRestApi ? FakeApiService : RealApiService,
})
export abstract class ApiService {
  // populate
  abstract populate(): Observable<void>;

  abstract getConfig(): Observable<ConfigEntity>;

  // auth

  abstract login(
    email: string,
    password: string
  ): Observable<{ token: string }>;

  abstract register(
    email: string,
    password: string,
    name: string
  ): Observable<void>;

  abstract refreshToken(token: string): Observable<{ token: string }>;

  // abstract mediaAccessToken(projectId: string): Observable<{ token: string }>;

  // verifyEmail() {}

  abstract verifyInviteToken(token: string): Observable<InviteEntity>;

  abstract joinViaInviteToken(token: string): Observable<void>;

  abstract guestLogin(
    token?: string,
    name?: string
  ): Observable<GuestLoginEntity>;

  // users
  abstract findAllUsers(search: string): Observable<UserEntity[]>;

  // projects
  abstract createProject(
    project: FormData
  ): Observable<HttpEvent<ProjectEntity>>;

  abstract findAllProjects(): Observable<ProjectListEntity>;

  abstract findOneProject(projectId: string): Observable<ProjectEntity>;

  abstract findProjectMediaEntity(
    projectId: string
  ): Observable<ProjectMediaEntity>;

  abstract updateProject(
    projectId: string,
    project: UpdateProjectDto
  ): Observable<ProjectEntity>;

  abstract removeProject(projectId: string): Observable<void>;

  abstract deleteMedia(
    projectId: string,
    mediaId: string
  ): Observable<ProjectMediaEntity>;

  abstract uploadVideo(
    projectId: string,
    uploadVideoDto: UploadVideoDto,
    file: File
  ): Observable<HttpEvent<ProjectEntity>>;

  abstract invite(projectId: string, emails: string[]): Observable<void>;

  abstract getProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity>;

  abstract updateProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity>;

  abstract uploadMedia(projectId: string, file: File): Observable<void>;

  // abstract getWaveformData(projectId: string): Observable<WaveformData>;
  abstract getWaveformData(waveformUrl: string): Observable<WaveformData>;
  // joinProject(inviteLink: string): Observable<Project> {}

  abstract subscribeProject(projectId: string): Observable<void>;
  abstract unsubscribeProject(projectId: string): Observable<void>;

  // transcriptions

  //createTranscription() {}
  abstract createTranscription(
    transcription: CreateTranscriptionDto
  ): Observable<TranscriptionEntity>;

  abstract createTranscriptionFromFile(
    transcription: CreateTranscriptionDto,
    file: File
  ): Observable<HttpEvent<TranscriptionEntity>>;

  abstract findAllTranscriptions(
    projectId: string
  ): Observable<TranscriptionEntity[]>;

  //findOneTranscription() {}
  abstract findOneTranscription(
    transcriptionId: string
  ): Observable<TranscriptionEntity>;

  //updateTranscription() {}
  abstract updateTranscription(
    transcriptionId: string,
    transcription: UpdateTranscriptionDto
  ): Observable<TranscriptionEntity>;

  abstract createSpeakers(
    transcriptionId: string,
    createSpeakersDto: CreateSpeakersDto
  ): Observable<TranscriptionEntity>;

  abstract updateSpeaker(
    transcriptionId: string,
    speakerId: string,
    updateSpeakerDto: UpdateSpeakerDto
  ): Observable<TranscriptionEntity>;

  //removeTranscription() {}
  abstract removeTranscription(transcriptionId: string): Observable<void>;

  // download subtitles
  abstract downloadSubtitles(
    transcriptionId: string,
    type: 'srt' | 'vtt'
  ): Observable<Blob>;

  // captions

  abstract createCaption(
    captionDto: CreateCaptionDto
  ): Observable<CaptionEntity>;

  abstract findAllCaptions(
    transcriptionId: string
  ): Observable<CaptionListEntity>;

  //findOneCaption() {}

  abstract updateCaption(
    captionId: string,
    updateCaptionDto: UpdateCaptionDto
  ): Observable<CaptionEntity>;

  abstract removeCaption(captionId: string): Observable<void>;

  abstract getCaptionHistory(
    captionId: string
  ): Observable<CaptionHistoryEntity[]>;

  // Notifications

  abstract findAllNotifications(
    userId: string
  ): Observable<NotificationListEntity>;

  abstract findRecentNotifications(
    userId: string,
    limit: number
  ): Observable<NotificationListEntity>;

  abstract updateNotification(
    notificationId: string,
    updateNotificationDto: UpdateNotificationDto
  ): Observable<NotificationEntity>;

  abstract updateMayNotifications(
    updateManyNotificationsDto: UpdateManyNotificationsDto
  ): Observable<NotificationEntity[]>;

  abstract removeNotification(notificationId: string): Observable<void>;

  abstract bulkRemoveNotifications(
    bulkRemoveDto: BulkRemoveDto
  ): Observable<void>;

  // abstract updateNotification(
  //   notificationId: string,
  //   notification: UpdateNotificationDto
  // ): Observable<NotificationEntity>;

  // abstract removeNotification(notificationId: string): Observable<void>;

  abstract findAllActivities(projectId: string): Observable<ActivityListEntity>;

  // Livestream
  abstract connectLivestream(
    connectLivestreamDto: ConnectLivestreamDto
  ): Observable<ConnectLivestreamEntity>;

  abstract startLivestream(
    startLivestreamDto: StartLivestreamDto
  ): Observable<StartLivestreamEntity>;

  abstract stopLivestream(
    stopLivestreamDto: StopLivestreamDto
  ): Observable<StopLivestreamEntity>;

  abstract pauseLivestream(
    pauseLivestreamDto: PauseLivestreamDto
  ): Observable<PauseLivestreamEntity>;

  abstract resumeLivestream(
    resumeLivestreamDto: ResumeLivestreamDto
  ): Observable<ResumeLivestreamEntity>;

  //recording livestream
  abstract startRecording(
    dto: StartRecordingDto
  ): Observable<StartRecordingEntity>;

  abstract stopRecording(
    dto: StopRecordingDto
  ): Observable<StopRecordingEntity>;

  abstract pauseRecording(
    dto: PauseRecordingDto
  ): Observable<PauseRecordingEntity>;

  abstract resumeRecording(
    dto: ResumeRecordingDto
  ): Observable<ResumeRecordingEntity>;

  // User-Test
  abstract userTestStart(projectId: string): Observable<void>;
  abstract userTestStop(projectId: string): Observable<void>;
  abstract userTestReset(projectId: string): Observable<void>;
}
