import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { NOTIFICATION_ENTITY_MOCK } from 'src/app/constants/mocks/notifications.mock';
import { PROJECT_ENTITY_MOCK } from 'src/app/constants/mocks/project.mock';
import { USERS_MOCK } from 'src/app/constants/mocks/users.mock';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
import { CustomLogger } from '../../classes/logger.class';
import { ACTIVITY_ENTITY_MOCK } from '../../constants/mocks/activity.mock';
import {
  CAPTIONS_ENTITY_MOCK,
  TRANSCIRPTIONS_ENITITY_MOCK,
} from '../../constants/mocks/captions.mock';
import { UploadDto } from '../upload/upload.interfaces';
import { ApiService } from './api.service';
import { ChangePasswordDto } from './dto/auth.dto';
import { BulkRemoveDto } from './dto/bulk-remove.dto';
import { ConnectLivestreamDto } from './dto/connect-livestream.dto';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { CreateProjectDto } from './dto/create-project.dto';
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
import {
  UpdateManyNotificationsDto,
  UpdateNotificationDto,
} from './dto/update-notification.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ActivityListEntity } from './entities/activitiy-list.entity';
import {
  ChangePasswordEntity,
  GuestLoginEntity,
  InviteEntity,
} from './entities/auth.entity';
import { CaptionListEntity } from './entities/caption-list.entity';
import { CaptionEntity } from './entities/caption.entity';
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
import {
  SubtitleFormat,
  TranscriptionEntity,
} from './entities/transcription.entity';
import { AUTH_TOKEN_GUEST_MOCK, AUTH_TOKEN_USER_MOCK } from './mocks/auth.mock';

@Injectable({
  providedIn: 'root',
})
export class FakeApiService implements ApiService {
  private logger = new CustomLogger('FAKE API SERVICE');

  constructor() {}

  alignTranscription(transcriptionId: string): Observable<void> {
    throw new Error('Method not implemented.');
  }

  createTranscriptionFromFile(
    transcription: CreateTranscriptionDto,
    file: File
  ): Observable<any> {
    throw new Error('Method not implemented.');
  }

  getConfig(): Observable<any> {
    this.logger.verbose('config mocked');
    return of();
  }

  // populate
  populate(): Observable<void> {
    this.logger.verbose('populate mocked');
    return of();
  }

  // auth

  login(email: string, password: string): Observable<{ token: string }> {
    this.logger.verbose('login mocked');
    return of({
      token: AUTH_TOKEN_USER_MOCK,
    }).pipe(delay(4000));
  }

  register(email: string, password: string, name: string): Observable<void> {
    this.logger.verbose('register mocked');
    return of();
  }

  changePassword(dto: ChangePasswordDto): Observable<ChangePasswordEntity> {
    this.logger.verbose('changePassword');
    return of();
  }

  refreshToken(token: string): Observable<{ token: string }> {
    this.logger.verbose('refreshToken mocked');
    return of({ token });
  }

  // mediaAccessToken(projectId: string): Observable<{ token: string }> {
  //   return of();
  // }

  // verifyEmail() {}

  verifyInviteToken(token: string): Observable<InviteEntity> {
    this.logger.verbose('verifyInviteToken mocked');
    return of({
      projectId: PROJECT_ENTITY_MOCK[0].id,
      projectTitle: PROJECT_ENTITY_MOCK[0].title,
      userName: USERS_MOCK[0].name,
    });
  }

  joinViaInviteToken(token: string): Observable<void> {
    this.logger.verbose('joinViaInviteToken mocked');
    return of();
  }

  guestLogin(token: string, name: string): Observable<GuestLoginEntity> {
    this.logger.verbose('guestLogin mocked');
    return of({
      projectId: PROJECT_ENTITY_MOCK[0].id,
      token: AUTH_TOKEN_GUEST_MOCK,
    });
  }

  viewerLogin(token: string): Observable<GuestLoginEntity> {
    this.logger.verbose('viewerLogin mocked');
    return of({
      projectId: PROJECT_ENTITY_MOCK[0].id,
      token: AUTH_TOKEN_GUEST_MOCK,
    });
  }

  // users
  findAllUsers(search: string): Observable<UserEntity[]> {
    this.logger.verbose('findallUsers mocked');
    return of(USERS_MOCK);
  }

  deleteAccount(password: string): Observable<void> {
    this.logger.verbose('deleteAccount mocked');
    return of();
  }

  // projects
  createLegacyProject(project: FormData): Observable<any> {
    this.logger.verbose('createProject mocked');
    return of({ ...PROJECT_ENTITY_MOCK[0] });
  }

  createProject(project: CreateProjectDto): Observable<ProjectEntity> {
    this.logger.verbose('createProject mocked');
    return of({ ...PROJECT_ENTITY_MOCK[0] });
  }

  createDefaultProject(): Observable<any> {
    this.logger.verbose('createProject default mocked');
    return of({ ...PROJECT_ENTITY_MOCK[0] });
  }

  deleteMedia(projectId: string, mediaId: string) {
    return of();
  }

  createAdditionalVideo(
    projectId: string,
    uploadVideoDto: UploadVideoDto
  ): Observable<any> {
    return of({ ...PROJECT_ENTITY_MOCK[0] });
  }

  findAllProjects(): Observable<ProjectListEntity> {
    this.logger.verbose('findAllProjects mocked');
    return of({
      projects: PROJECT_ENTITY_MOCK,
      total: PROJECT_ENTITY_MOCK.length,
      page: 0,
    });
  }

  findOneProject(projectId: string): Observable<ProjectEntity> {
    this.logger.verbose('findOneProject mocked');
    return of(PROJECT_ENTITY_MOCK[0]);
  }

  findProjectMediaEntity(projectId: string): Observable<ProjectMediaEntity> {
    this.logger.verbose('findProjectMedia mocked');
    return of({ audios: [], videos: [] });
  }

  updateProject(
    projectId: string,
    project: UpdateProjectDto
  ): Observable<ProjectEntity> {
    this.logger.verbose('updateProject mocked');
    return of(PROJECT_ENTITY_MOCK[0]);
  }

  removeProject(projectId: string): Observable<void> {
    this.logger.verbose('removeProject mocked');
    return of();
  }

  invite(projectId: string, emails: string[]): Observable<void> {
    this.logger.verbose('invite mocked');
    return of();
  }

  removeUserFromProject(projectId: string, userId: string): Observable<void> {
    this.logger.verbose('remove collaborator mocked');
    return of();
  }

  getProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity> {
    this.logger.verbose('getProjectInviteToken mocked');
    return of({
      inviteToken:
        'yelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
    });
  }

  getProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity> {
    this.logger.verbose('getProjectInviteToken mocked');
    return of({
      viewerToken:
        'yelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
    });
  }

  updateProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity> {
    this.logger.verbose('updateProjectInviteToken mocked');
    return of({
      inviteToken:
        'yelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
    });
  }

  updateProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity> {
    this.logger.verbose('updateProjectViewerToken mocked');
    return of({
      viewerToken:
        'yelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
    });
  }

  uploadMedia(projectId: string, file: File): Observable<any> {
    return of();
  }

  getWaveformData(projectId: string): any {
    return;
  }

  // joinProject(inviteLink: string): Observable<Project> {}

  subscribeProject(projectId: string): Observable<void> {
    return of();
  }
  unsubscribeProject(projectId: string): Observable<void> {
    return of();
  }

  // transcriptions

  //createTranscription() {}
  createTranscription(
    transcription: CreateTranscriptionDto
  ): Observable<TranscriptionEntity> {
    this.logger.verbose('createTranscription mocked');
    return of(TRANSCIRPTIONS_ENITITY_MOCK[0]);
  }

  findAllTranscriptions(): Observable<TranscriptionEntity[]> {
    this.logger.verbose('findAllTranscriptions mocked');
    return of(TRANSCIRPTIONS_ENITITY_MOCK);
  }

  //findOneTranscription() {}
  findOneTranscription(
    transcriptionId: string
  ): Observable<TranscriptionEntity> {
    this.logger.verbose('findOneTranscription mocked');
    return of(TRANSCIRPTIONS_ENITITY_MOCK[0]);
  }
  //updateTranscription() {}
  updateTranscription(
    transcriptionId: string,
    transcription: UpdateTranscriptionDto
  ): Observable<TranscriptionEntity> {
    this.logger.verbose('updateTranscription mocked');
    return of(TRANSCIRPTIONS_ENITITY_MOCK[0]);
  }

  createSpeakers(
    transcriptionId: string,
    createSpeakersDto: CreateSpeakersDto
  ): Observable<TranscriptionEntity> {
    return of();
  }

  removeSpeaker(
    transcriptionId: string,
    speakerId: string
  ): Observable<TranscriptionEntity> {
    return of();
  }

  updateSpeaker(
    transcriptionId: string,
    speakerId: string,
    updateSpeakerDto: UpdateSpeakerDto
  ): Observable<TranscriptionEntity> {
    return of();
  }
  //removeTranscription() {}
  removeTranscription(transcriptionId: string): Observable<void> {
    this.logger.verbose('removeTranscription mocked');
    return of();
  }

  downloadSubtitles(
    transcriptionId: string,
    type: SubtitleFormat
  ): Observable<any> {
    return of();
  }

  transcriptionGetCaptions(transcriptionId: string): Observable<any> {
    return of();
  }

  // captions

  createCaption(captionDto: CreateCaptionDto): Observable<CaptionEntity> {
    this.logger.verbose('createCaption mocked');
    return of(CAPTIONS_ENTITY_MOCK[0]);
  }

  findAllCaptions(): Observable<CaptionListEntity> {
    this.logger.verbose('findAllCaptions mocked');
    return of({
      total: 0,
      page: 0,
      captions: CAPTIONS_ENTITY_MOCK,
    });
  }
  //findOneCaption() {}
  updateCaption() {
    this.logger.verbose('updateCaption mocked');
    return of(CAPTIONS_ENTITY_MOCK[0]);
  }
  removeCaption(): Observable<void> {
    this.logger.verbose('removeCaption mocked');
    return of();
  }

  getCaptionHistory() {
    this.logger.verbose('getCaptionHistory mocked');
    return of();
  }

  // Notifications
  findAllNotifications(userId: string): Observable<NotificationListEntity> {
    this.logger.verbose('findAllNotifications mocked');
    return of({
      notifications: NOTIFICATION_ENTITY_MOCK,
      total: NOTIFICATION_ENTITY_MOCK.length,
      page: 0,
    });
  }

  findRecentNotifications(
    userId: string,
    limit: number
  ): Observable<NotificationListEntity> {
    return of({
      notifications: NOTIFICATION_ENTITY_MOCK,
      total: NOTIFICATION_ENTITY_MOCK.length,
      page: 0,
    });
  }

  updateNotification(
    notificationId: string,
    updateNotificationDto: UpdateNotificationDto
  ): Observable<NotificationEntity> {
    this.logger.verbose('updateNotification mocked');
    return of(NOTIFICATION_ENTITY_MOCK[0]);
  }

  updateMayNotifications(
    updateManyNotificationsDto: UpdateManyNotificationsDto
  ): Observable<NotificationEntity[]> {
    return of();
  }

  removeNotification(notificationId: string): Observable<void> {
    this.logger.verbose('removeNotification mocked');
    return of();
  }

  findAllActivities(projectId: string): Observable<ActivityListEntity> {
    this.logger.verbose('findAllActivities mocked');
    return of({
      activities: [ACTIVITY_ENTITY_MOCK],
      count: 1,
      total: 1,
      page: 0,
    });
  }

  bulkRemoveNotifications(bulkRemoveDto: BulkRemoveDto): Observable<any> {
    this.logger.verbose('bulkRemoveNotifications mocked');
    return of({});
  }

  // Livestream
  connectLivestream(
    connectLivestreamDto: ConnectLivestreamDto
  ): Observable<ConnectLivestreamEntity> {
    console.log('connectLivestream mocked');
    return of({ sdpAnswer: '' });
  }

  startLivestream(
    startLivestreamDto: StartLivestreamDto
  ): Observable<StartLivestreamEntity> {
    console.log('startLivestream mocked');
    return of();
  }

  stopLivestream(
    stopLivestreamDto: StopLivestreamDto
  ): Observable<StopLivestreamEntity> {
    console.log('stopLivestream mocked');
    return of();
  }

  pauseLivestream(
    pauseLivestreamDto: PauseLivestreamDto
  ): Observable<PauseLivestreamEntity> {
    console.log('pauseLivestream mocked');
    return of();
  }

  resumeLivestream(
    resumeLivestreamDto: ResumeLivestreamDto
  ): Observable<ResumeLivestreamEntity> {
    console.log('resumeLivestream mocked');
    return of();
  }

  startRecording(dto: StartRecordingDto): Observable<StartRecordingEntity> {
    console.log('start recording mocked');
    return of();
  }

  stopRecording(dto: StopRecordingDto): Observable<StopRecordingEntity> {
    console.log('stop recording mocked');
    return of();
  }

  pauseRecording(dto: PauseRecordingDto): Observable<PauseRecordingEntity> {
    console.log('pause recording mocked');
    return of();
  }

  resumeRecording(dto: ResumeRecordingDto): Observable<ResumeRecordingEntity> {
    console.log('resume recording mocked');
    return of();
  }

  // helpers

  // User-Test
  userTestStart(projectId: string): Observable<void> {
    this.logger.verbose('userTestStart mocked');
    return of();
  }

  userTestStop(projectId: string): Observable<void> {
    this.logger.verbose('userTestStop mocked');
    return of();
  }

  userTestReset(projectId: string): Observable<void> {
    this.logger.verbose('userTestReset mocked');
    return of();
  }

  // upload service

  createUpload(uploadDto: UploadDto) {
    this.logger.verbose('createUpload mocked');
    return of();
  }
  updateUpload(id: string, filePart: Blob) {
    this.logger.verbose('updateUpload mocked');
    return of();
  }

  cancelUpload(id: string) {
    this.logger.verbose('cancelUpload mocked');
    return of();
  }
}
