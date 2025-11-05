import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { ApiService } from '../../../services/api/api.service';
import { WSService } from '../../../services/ws/ws.service';
import { MediaService } from '../editor/service/media/media.service';

@Injectable({
  providedIn: 'root',
})
export class LivestreamService implements OnDestroy {
  private destroy$$ = new Subject<void>();
  private connection!: RTCPeerConnection;

  private candidatesQueue: RTCIceCandidateInit[] = [];

  private streamTo: ElementRef<HTMLVideoElement> | null = null;

  constructor(
    private apiService: ApiService,
    private ws: WSService,
    private mediaService: MediaService
  ) {
    this.ws.onServerIceCandidate$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((data) => {
        const candidate = JSON.parse(data.candidate) as RTCIceCandidateInit;
        if (this.connection.currentRemoteDescription === null) {
          this.candidatesQueue.push(candidate);
        } else {
          this.connection.addIceCandidate(candidate);
        }
      });
  }

  public get isConnected() {
    return this.streamTo ? true : false;
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
    this.connection.close();
  }

  async disconnect() {
    //TODO
    this.streamTo = null;
    if (this.connection) this.connection.close();
    this.destroy$$.next();
    this.candidatesQueue = [];
  }

  async connect(
    projectId: string,
    streamTo: ElementRef<HTMLVideoElement>
  ): Promise<void> {
    this.streamTo = streamTo;

    this.connection = new RTCPeerConnection();

    this.connection.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (streamTo.nativeElement.srcObject !== stream) {
        streamTo.nativeElement.srcObject = stream;
      }
    };

    const offer = await this.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    const res = await firstValueFrom(
      this.apiService.connectLivestream({
        projectId,
        sdpOffer: offer.sdp?.toString() as string,
      })
    );

    this.connection.setLocalDescription(offer);
    this.connection.setRemoteDescription({
      type: 'answer',
      sdp: res.sdpAnswer,
    });

    // Add pending ice-candidates
    this.candidatesQueue.forEach((candidate) =>
      this.connection.addIceCandidate(candidate)
    );
    this.candidatesQueue.length = 0;
  }

  async start(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.startLivestream({
        projectId,
      })
    );
  }

  async stop(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.stopLivestream({
        projectId,
      })
    );
  }

  async pause(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.pauseLivestream({
        projectId,
      })
    );
  }

  async resume(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.resumeLivestream({
        projectId,
      })
    );
  }

  async startRecording(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.startRecording({
        projectId,
      })
    );
  }
  async stopRecording(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.stopRecording({
        projectId,
      })
    );
  }
  async pauseRecording(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.pauseRecording({
        projectId,
      })
    );
  }
  async resumeRecording(projectId: string) {
    const res = await firstValueFrom(
      this.apiService.resumeRecording({
        projectId,
      })
    );
  }
}
