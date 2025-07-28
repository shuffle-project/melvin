import {
  HttpClient,
  HttpContext,
  HttpEvent,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as viewerSelector from '../../store/selectors/viewer.selector';
import { ConfigService } from '../config/config.service';
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
import { UpdateCaptionDto } from './dto/update-caption.dto';
import {
  UpdateManyNotificationsDto,
  UpdateNotificationDto,
} from './dto/update-notification.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { UploadVideoDto as CreateVideoDto } from './dto/upload-video.dto';
import { ActivityListEntity } from './entities/activitiy-list.entity';
import {
  ChangePasswordEntity,
  GuestLoginEntity,
  InviteEntity,
  ViewerLoginEntity,
} from './entities/auth.entity';
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
import { UploadEntity } from './entities/upload-file.entity';
import { WaveformData } from './entities/waveform-data.entity';

export interface RequestOptions {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  context?: HttpContext;
  observe?: 'body';
  params?:
    | HttpParams
    | {
        [param: string]:
          | string
          | number
          | boolean
          | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

export interface CustomRequestOptions extends RequestOptions {
  skipJwt?: boolean;
  useViewerToken?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RealApiService implements ApiService {
  private baseUrl: string = this.configService.getBackendBaseUrl();

  private authToken$ = this.store.select(authSelectors.selectToken);
  private authToken!: string | null;

  private viewerToken$ = this.store.select(viewerSelector.vAccessToken);
  private viewerToken!: string | null;

  constructor(
    private httpClient: HttpClient,
    private store: Store,
    private configService: ConfigService
  ) {
    this.authToken$.subscribe((token) => {
      this.authToken = token;
    });
    this.viewerToken$.subscribe((token) => {
      this.viewerToken = token;
    });
  }

  _transformRequestOptions(options: CustomRequestOptions): RequestOptions {
    const { headers = {}, skipJwt, ...requestOptions } = options;

    const chosenToken = options.useViewerToken
      ? this.viewerToken
      : this.authToken;
    return {
      headers: {
        ...(skipJwt || !chosenToken
          ? {}
          : { Authorization: `Bearer ${chosenToken}` }),
        ...headers,
      },
      ...requestOptions,
    };
  }

  _get<T>(url: string, options: CustomRequestOptions = {}): Observable<T> {
    return this.httpClient.get<T>(
      `${this.baseUrl}${url}`,
      this._transformRequestOptions(options)
    );
  }

  _post<T>(
    url: string,
    body: any,
    options: CustomRequestOptions = {}
  ): Observable<T> {
    return this.httpClient.post<T>(
      `${this.baseUrl}${url}`,
      body,
      this._transformRequestOptions(options)
    );
  }

  _put<T>(
    url: string,
    body: any,
    options: CustomRequestOptions = {}
  ): Observable<T> {
    return this.httpClient.put<T>(
      `${this.baseUrl}${url}`,
      body,
      this._transformRequestOptions(options)
    );
  }

  _patch<T>(
    url: string,
    body: any,
    options: CustomRequestOptions = {}
  ): Observable<T> {
    return this.httpClient.patch<T>(
      `${this.baseUrl}${url}`,
      body,
      this._transformRequestOptions(options)
    );
  }

  _delete<T>(url: string, options: CustomRequestOptions = {}): Observable<T> {
    return this.httpClient.delete<T>(
      `${this.baseUrl}${url}`,
      this._transformRequestOptions(options)
    );
  }

  // populate
  populate(): Observable<void> {
    return this._post<void>(`/populate`, {});
  }

  getConfig(): Observable<ConfigEntity> {
    return this._get<ConfigEntity>(`/config`);
  }

  // auth

  login(email: string, password: string): Observable<{ token: string }> {
    return this._post<{ token: string }>(
      `/auth/login`,
      {
        email,
        password,
      },
      { skipJwt: true }
    );
  }

  register(email: string, password: string, name: string): Observable<void> {
    return this._post<void>(
      `/auth/register`,
      {
        email,
        password,
        name,
      },
      { skipJwt: true }
    );
  }

  changePassword(dto: ChangePasswordDto): Observable<ChangePasswordEntity> {
    return this._post<{ token: string }>(`/auth/change-password`, dto, {
      skipJwt: true,
    });
  }

  refreshToken(token: string): Observable<{ token: string }> {
    return this._post<{ token: string }>(`/auth/refresh-token`, { token });
  }

  // mediaAccessToken(projectId: string): Observable<{ token: string }> {
  //   return this._post<{ token: string }>(`/auth/media-access-token`, {
  //     projectId,
  //   });
  // }

  // verifyEmail() {}
  // guestLogin() {}

  verifyInviteToken(token: string): Observable<InviteEntity> {
    return this._get<InviteEntity>(`/auth/verify-invite/${token}`, {
      skipJwt: true,
    });
  }

  joinViaInviteToken(token: string): Observable<void> {
    return this._post<void>(
      `/projects/invite-token`,
      { inviteToken: token }
      // {
      //   skipJwt: true,
      // }
    );
  }

  guestLogin(token: string, name: string): Observable<GuestLoginEntity> {
    return this._post<GuestLoginEntity>(
      `/auth/guest-login`,
      { inviteToken: token, name },
      { skipJwt: true }
    );
  }

  viewerLogin(token: string): Observable<ViewerLoginEntity> {
    return this._post<ViewerLoginEntity>(
      `/auth/viewer-login`,
      { viewerToken: token },
      { skipJwt: true }
    );
  }

  // users
  findAllUsers(search: string): Observable<UserEntity[]> {
    return this._get<UserEntity[]>('/users', { params: { search } });
  }

  deleteAccount(password: string): Observable<void> {
    return this._post<void>('/users', { password });
  }

  createLegacyProject(project: FormData): Observable<HttpEvent<ProjectEntity>> {
    return this._post<HttpEvent<ProjectEntity>>(`/projects/legacy`, project, {
      reportProgress: true,
      observe: 'events' as any,
    });
  }

  createProjectOld(project: FormData): Observable<HttpEvent<ProjectEntity>> {
    return this._post<HttpEvent<ProjectEntity>>(`/projects`, project, {
      reportProgress: true,
      observe: 'events' as any,
    });
  }

  createProject(createProjectDto: CreateProjectDto): Observable<ProjectEntity> {
    return this._post<ProjectEntity>(`/projects`, createProjectDto);
  }

  createDefaultProject(): Observable<ProjectEntity> {
    return this._post<ProjectEntity>(`/projects/default`, {});
  }

  deleteMedia(
    projectId: string,
    mediaId: string
  ): Observable<ProjectMediaEntity> {
    return this._delete<ProjectMediaEntity>(
      `/projects/${projectId}/media/${mediaId}`
    );
  }

  createAdditionalVideo(
    projectId: string,
    createVideoDto: CreateVideoDto
  ): Observable<ProjectEntity> {
    console.log(createVideoDto);
    return this._post<ProjectEntity>(`/projects/${projectId}/media/create`, {
      ...createVideoDto,
    });
  }

  findAllProjects(): Observable<ProjectListEntity> {
    return this._get<ProjectListEntity>('/projects');
  }

  findOneProject(
    projectId: string,
    useViewerToken?: boolean
  ): Observable<ProjectEntity> {
    return this._get<ProjectEntity>(`/projects/${projectId}`, {
      useViewerToken,
    });
  }

  findProjectMediaEntity(
    projectId: string,
    useViewerToken?: boolean
  ): Observable<ProjectMediaEntity> {
    return this._get<ProjectMediaEntity>(`/projects/${projectId}/media`, {
      useViewerToken,
    });
  }

  updateProject(
    projectId: string,
    project: UpdateProjectDto
  ): Observable<ProjectEntity> {
    return this._patch<ProjectEntity>(`/projects/${projectId}`, { ...project });
  }

  removeProject(projectId: string): Observable<void> {
    return this._delete<void>(`/projects/${projectId}`);
  }

  uploadMedia(projectId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this._post(`/projects/${projectId}/upload-video`, formData, {
      reportProgress: true,
      observe: 'events' as any,
    });
  }
  //  old
  // getWaveformData(projectId: string): Observable<WaveformData> {
  //   return this._get<WaveformData>(`/projects/${projectId}/media/waveform`);
  // }
  getWaveformData(waveformUrl: string): Observable<WaveformData> {
    return this.httpClient.get<WaveformData>(waveformUrl);
  }

  invite(projectId: string, emails: string[]): Observable<void> {
    return this._post<void>(`/projects/${projectId}/invite`, { emails });
  }

  removeUserFromProject(projectId: string, userId: string): Observable<void> {
    return this._delete<void>(`/projects/${projectId}/users/${userId}`);
  }

  getProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity> {
    return this._get<ProjectViewerTokenEntity>(
      `/projects/${projectId}/viewer-token`
    );
  }

  updateProjectViewerToken(
    projectId: string
  ): Observable<ProjectViewerTokenEntity> {
    return this._post<ProjectViewerTokenEntity>(
      `/projects/${projectId}/viewer-token`,
      {}
    );
  }

  getProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity> {
    return this._get<ProjectInviteTokenEntity>(
      `/projects/${projectId}/invite-token`
    );
  }

  updateProjectInviteToken(
    projectId: string
  ): Observable<ProjectInviteTokenEntity> {
    return this._post<ProjectInviteTokenEntity>(
      `/projects/${projectId}/invite-token`,
      {}
    );
  }

  // joinProject(inviteLink: string): Observable<Project> {}

  subscribeProject(projectId: string): Observable<void> {
    return this._post<void>(`/projects/${projectId}/subscribe`, {});
  }
  unsubscribeProject(projectId: string): Observable<void> {
    return this._post<void>(`/projects/${projectId}/unsubscribe`, {});
  }

  // transcriptions

  alignTranscription(transcriptionId: string): Observable<void> {
    return this._patch<void>(`/transcriptions/${transcriptionId}/align`, {});
  }

  createTranscription(
    transcription: CreateTranscriptionDto
  ): Observable<TranscriptionEntity> {
    return this._post<TranscriptionEntity>(`/transcriptions`, {
      ...transcription,
    });
  }

  // createTranscriptionFromFile(
  //   transcription: CreateTranscriptionDto,
  //   file: File
  // ): Observable<HttpEvent<TranscriptionEntity>> {
  //   const formData = new FormData();
  //   formData.append('project', transcription.project);
  //   formData.append('title', transcription.title);
  //   formData.append('language', transcription.language);
  //   formData.append('file', file);

  //   return this._post<HttpEvent<TranscriptionEntity>>(
  //     `/transcriptions`,
  //     formData,
  //     {
  //       reportProgress: true,
  //       observe: 'events' as any,
  //     }
  //   );
  // }

  findAllTranscriptions(
    projectId: string,
    useViewerToken?: boolean
  ): Observable<TranscriptionEntity[]> {
    return this._get<TranscriptionEntity[]>(`/transcriptions`, {
      params: { projectId },
      useViewerToken,
    });
  }

  findOneTranscription(
    transcriptionId: string
  ): Observable<TranscriptionEntity> {
    return this._get<TranscriptionEntity>(`/transcriptions/${transcriptionId}`);
  }

  //updateTranscription() {}
  updateTranscription(
    transcriptionId: string,
    transcription: UpdateTranscriptionDto
  ): Observable<TranscriptionEntity> {
    return this._patch<TranscriptionEntity>(
      `/transcriptions/${transcriptionId}`,
      { ...transcription }
    );
  }

  createSpeakers(
    transcriptionId: string,
    createSpeakersDto: CreateSpeakersDto
  ): Observable<TranscriptionEntity> {
    return this._post<TranscriptionEntity>(
      `/transcriptions/${transcriptionId}/speakers`,
      { ...createSpeakersDto }
    );
  }

  removeSpeaker(
    transcriptionId: string,
    speakerId: string
  ): Observable<TranscriptionEntity> {
    return this._delete<TranscriptionEntity>(
      `/transcriptions/${transcriptionId}/speakers/${speakerId}`
    );
  }

  updateSpeaker(
    transcriptionId: string,
    speakerId: string,
    updateSpeakerDto: UpdateSpeakerDto
  ): Observable<TranscriptionEntity> {
    return this._patch<TranscriptionEntity>(
      `/transcriptions/${transcriptionId}/speakers/${speakerId}`,
      { ...updateSpeakerDto }
    );
  }

  //removeTranscription() {}
  removeTranscription(transcriptionId: string): Observable<void> {
    return this._delete<void>(`/transcriptions/${transcriptionId}`);
  }

  downloadSubtitles(
    transcriptionId: string,
    type: SubtitleFormat
  ): Observable<Blob> {
    return this._get(`/transcriptions/${transcriptionId}/downloadSubtitles`, {
      params: { type },
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      responseType: 'blob' as any,
    });
  }

  transcriptionGetCaptions(transcriptionId: string, useViewerToken?: boolean) {
    return this._get<any>(`/transcriptions/${transcriptionId}/getCaptions`, {
      useViewerToken,
    });
  }

  // captions

  createCaption(captionDto: CreateCaptionDto): Observable<CaptionEntity> {
    return this._post<CaptionEntity>(`/captions`, { ...captionDto });
  }

  findAllCaptions(
    transcriptionId: string,
    useViewerToken?: boolean
  ): Observable<CaptionListEntity> {
    return this._get<CaptionListEntity>(`/captions`, {
      params: { transcriptionId },
      useViewerToken,
    });
  }
  //findOneCaption() {}
  updateCaption(
    captionId: string,
    updateCaptionDto: UpdateCaptionDto
  ): Observable<CaptionEntity> {
    return this._patch<CaptionEntity>(`/captions/${captionId}`, {
      ...updateCaptionDto,
    });
  }

  removeCaption(captionId: string): Observable<void> {
    return this._delete<void>(`/captions/${captionId}`);
  }

  getCaptionHistory(captionId: string): Observable<CaptionHistoryEntity[]> {
    return this._get<CaptionHistoryEntity[]>(`/captions/${captionId}/history`);
  }

  // Notifications

  findAllNotifications(userId: string): Observable<NotificationListEntity> {
    return this._get<NotificationListEntity>(`/notifications`, {
      params: { userId },
    });
  }

  findRecentNotifications(
    userId: string,
    limit: number
  ): Observable<NotificationListEntity> {
    return this._get<NotificationListEntity>(`/notifications`, {
      params: {
        userId,
        page: 1,
        limit,
        read: false,
      },
    });
  }

  updateNotification(
    notificationId: string,
    updateNotificationDto: UpdateNotificationDto
  ): Observable<NotificationEntity> {
    return this._patch<NotificationEntity>(`/notifications/${notificationId}`, {
      ...updateNotificationDto,
    });
  }

  updateMayNotifications(
    updateManyNotificationsDto: UpdateManyNotificationsDto
  ): Observable<NotificationEntity[]> {
    return this._patch<NotificationEntity[]>(`/notifications/`, {
      ...updateManyNotificationsDto,
    });
  }

  removeNotification(notificationId: string): Observable<void> {
    return this._delete<void>(`/notifications/${notificationId}`);
  }

  // Activities
  findAllActivities(projectId: string): Observable<ActivityListEntity> {
    return this._get('/activities', { params: { projectId } });
  }

  bulkRemoveNotifications(bulkRemoveDto: BulkRemoveDto): Observable<void> {
    return this._post(`/notifications/bulk-remove`, { ...bulkRemoveDto });
  }

  // Livestream

  connectLivestream(
    connectLivestreamDto: ConnectLivestreamDto
  ): Observable<ConnectLivestreamEntity> {
    return this._post('/livestreams/connect', { ...connectLivestreamDto });
  }

  startLivestream(
    startLivestreamDto: StartLivestreamDto
  ): Observable<StartLivestreamEntity> {
    return this._post('/livestreams/start', { ...startLivestreamDto });
  }

  stopLivestream(
    stopLivestreamDto: StopLivestreamDto
  ): Observable<StopLivestreamEntity> {
    return this._post('/livestreams/stop', { ...stopLivestreamDto });
  }

  pauseLivestream(
    pauseLivestreamDto: PauseLivestreamDto
  ): Observable<PauseLivestreamEntity> {
    return this._post('/livestreams/pause', { ...pauseLivestreamDto });
  }

  resumeLivestream(
    resumeLivestreamDto: ResumeLivestreamDto
  ): Observable<ResumeLivestreamEntity> {
    return this._post('/livestreams/resume', { ...resumeLivestreamDto });
  }

  // recording
  startRecording(dto: StartRecordingDto): Observable<StartRecordingEntity> {
    return this._post('/livestreams/startRecording', { ...dto });
  }

  stopRecording(dto: StopRecordingDto): Observable<StopRecordingEntity> {
    return this._post('/livestreams/stopRecording', { ...dto });
  }

  pauseRecording(dto: PauseRecordingDto): Observable<PauseRecordingEntity> {
    return this._post('/livestreams/pauseRecording', { ...dto });
  }

  resumeRecording(dto: ResumeRecordingDto): Observable<ResumeRecordingEntity> {
    return this._post('/livestreams/resumeRecording', { ...dto });
  }

  // User-Test
  userTestStart(projectId: string): Observable<void> {
    return this._post('/user-test/start', { projectId });
  }

  userTestStop(projectId: string): Observable<void> {
    return this._post('/user-test/stop', { projectId });
  }

  userTestReset(projectId: string): Observable<void> {
    return this._post('/user-test/reset', { projectId });
  }

  // upload service

  createUpload(uploadDto: UploadDto) {
    return this._post<UploadEntity>('/upload', { ...uploadDto });
  }
  updateUpload(id: string, filePart: Blob) {
    console.log('updateUpload called', id);
    return this._patch(`/upload/${id}`, filePart, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }
  cancelUpload(id: string) {
    return this._delete(`/upload/${id}`);
  }
}
