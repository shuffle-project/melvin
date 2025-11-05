import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  UserEntity,
  UserEntityForAdmin,
} from 'src/app/services/api/entities/user.entity';
import { environment } from '../../../environments/environment';
import { UploadDto } from '../upload/upload.interfaces';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangePasswordDto } from './dto/auth.dto';
import { BulkRemoveDto } from './dto/bulk-remove.dto';
import { ConnectLivestreamDto } from './dto/connect-livestream.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateSpeakersDto } from './dto/create-speakers.dto';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { PauseLivestreamDto } from './dto/pause-livestream.dto';
import { PauseRecordingDto } from './dto/pause-recording,dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResumeLivestreamDto } from './dto/resume-livestream.dto';
import { ResumeRecordingDto } from './dto/resume-recording.dto';
import { StartLivestreamDto } from './dto/start-livestream.dto';
import { StartRecordingDto } from './dto/start-recording.dto';
import { StopLivestreamDto } from './dto/stop-livestream.dto';
import { StopRecordingDto } from './dto/stop-recording.dto';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import {
  UpdateManyNotificationsDto,
  UpdateNotificationDto,
} from './dto/update-notification.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ActivityListEntity } from './entities/activitiy-list.entity';
import {
  ChangePasswordEntity,
  InviteEntity,
  ViewerLoginEntity,
} from './entities/auth.entity';
import { TiptapCaption } from './entities/caption.entity';
import { ConfigEntity } from './entities/config.entity';
import { ConnectLivestreamEntity } from './entities/connect-livestream.entity';
import { NotificationListEntity } from './entities/notification-list.entity';
import { NotificationEntity } from './entities/notification.entity';
import { PauseLivestreamEntity } from './entities/pause-livestream.entity';
import { PauseRecordingEntity } from './entities/pause-recording,entity';
import { ProjectInviteTokenEntity } from './entities/project-invite-token.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { ProjectViewerTokenEntity } from './entities/project-viewer-token.entity';
import { ProjectEntity, ProjectMediaEntity } from './entities/project.entity';
import { ResumeLivestreamEntity } from './entities/resume-livestream.entity';
import { ResumeRecordingEntity } from './entities/resume-recording';
import { StartLivestreamEntity } from './entities/start-livestream.entity';
import { StartRecordingEntity } from './entities/start-recording.entity';
import { StopLivestreamEntity } from './entities/stop-livestream.entity';
import { StopRecordingEntity } from './entities/stop-recording.entity';
import { TeamEntity, TeamListEntity } from './entities/team.entity';
import {
  SubtitleFormat,
  TranscriptionEntity,
} from './entities/transcription.entity';
import { UploadEntity } from './entities/upload-file.entity';
import { WaveformData } from './entities/waveform-data.entity';
import { FakeApiService } from './fake-api.service';
import { RealApiService } from './real-api.service';

@Injectable({
  providedIn: 'root',
  useClass: environment.env === 'test' ? FakeApiService : RealApiService,
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

  abstract changePassword(
    dto: ChangePasswordDto
  ): Observable<ChangePasswordEntity>;

  abstract refreshToken(token: string): Observable<{ token: string }>;

  abstract verifyInviteToken(token: string): Observable<InviteEntity>;

  abstract joinViaInviteToken(token: string): Observable<void>;

  abstract viewerLogin(viewerToken: string): Observable<ViewerLoginEntity>;

  // users
  abstract findAllUsers(search: string): Observable<UserEntity[]>;

  abstract deleteAccount(password: string): Observable<void>;

  abstract updateUser(dto: UpdateUserDto): Observable<UserEntity>;

  // projects
  abstract createProject(project: CreateProjectDto): Observable<ProjectEntity>;

  abstract createDefaultProject(): Observable<ProjectEntity>;

  abstract findAllProjects(): Observable<ProjectListEntity>;

  abstract findOneProject(
    projectId: string,
    useViewerToken?: boolean
  ): Observable<ProjectEntity>;

  abstract findProjectMediaEntity(
    projectId: string,
    useViewerToken?: boolean
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

  abstract createAdditionalVideo(
    projectId: string,
    uploadVideoDto: UploadVideoDto
  ): Observable<ProjectEntity>;

  abstract invite(projectId: string, emails: string[]): Observable<void>;
  abstract removeUserFromProject(
    projectId: string,
    userId: string
  ): Observable<void>;

  abstract getProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity>;

  abstract getProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity>;

  abstract updateProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity>;

  abstract updateProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity>;

  abstract uploadMedia(projectId: string, file: File): Observable<void>;

  abstract getWaveformData(waveformUrl: string): Observable<WaveformData>;

  abstract subscribeProject(projectId: string): Observable<void>;
  abstract unsubscribeProject(projectId: string): Observable<void>;

  // transcriptions

  abstract alignTranscription(transcriptionId: string): Observable<void>;

  //createTranscription() {}
  abstract createTranscription(
    transcription: CreateTranscriptionDto
  ): Observable<TranscriptionEntity>;

  abstract findAllTranscriptions(
    projectId: string,
    useViewerToken?: boolean
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

  abstract removeSpeaker(
    transcriptionId: string,
    speakerId: string
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
    type: SubtitleFormat
  ): Observable<Blob>;

  abstract transcriptionGetCaptions(
    transcriptionId: string,
    useViewerToken?: boolean
  ): Observable<TiptapCaption[]>;

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

  // upload service
  abstract createUpload(uploadDto: UploadDto): Observable<UploadEntity>;
  abstract updateUpload(id: string, filePart: Blob): Observable<any>;
  abstract cancelUpload(id: string): Observable<any>;

  // admin
  abstract adminLogin(
    username: string,
    password: string
  ): Observable<{ token: string }>;
  abstract adminFindAllUsers(): Observable<{
    users: Readonly<UserEntityForAdmin[]>;
  }>;

  abstract adminDeleteUserAccount(userId: string): Observable<void>;

  abstract adminUpdateUserEmail(
    userId: string,
    email: string
  ): Observable<UserEntityForAdmin>;

  abstract adminUpdateUser(
    userId: string,
    dto: AdminUpdateUserDto
  ): Observable<UserEntityForAdmin>;

  abstract adminResetUserPassword(
    userId: string
  ): Observable<{ method: 'email' | 'return'; password: string }>;

  abstract adminCreateUser(
    email: string,
    name: string
  ): Observable<{
    method: 'email' | 'return';
    password: string;
    user: UserEntityForAdmin;
  }>;

  abstract adminVerifyUserEmail(userId: string): Observable<UserEntityForAdmin>;

  // user verify email
  abstract verifyEmail(
    token: string,
    email: string
  ): Observable<{ token: string }>;

  abstract requestVerificationEmail(): Observable<void>;

  abstract requestResetPassword(email: string): Observable<void>;
  abstract resetPassword(resetPasswordDto: ResetPasswordDto): Observable<void>;

  // teams
  abstract adminFindAllTeams(): Observable<TeamListEntity>;
  abstract adminCreateTeam(
    createTeamDto: CreateTeamDto
  ): Observable<TeamEntity>;

  abstract adminUpdateTeam(
    id: string,
    updateTeamDto: UpdateTeamDto
  ): Observable<TeamEntity>;

  abstract adminRemoveTeam(id: string): Observable<void>;
}
