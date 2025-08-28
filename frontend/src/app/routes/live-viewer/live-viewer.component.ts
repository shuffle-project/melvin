import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ApiService } from 'src/app/services/api/api.service';
import * as viewerActions from '../../store/actions/viewer.actions';

import { MatButtonModule } from '@angular/material/button';
import { Title } from '@angular/platform-browser';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { RemoteTrack, RemoteVideoTrack, Room, RoomEvent } from 'livekit-client';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as viewerSelector from '../../store/selectors/viewer.selector';
import { TiptapViewerComponent } from './components/tiptap-viewer/tiptap-viewer.component';

@Component({
  selector: 'app-live-viewer',
  imports: [MatButtonModule, PushPipe, TiptapViewerComponent],
  templateUrl: './live-viewer.component.html',
  styleUrl: './live-viewer.component.scss',
})
export class LiveViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() token!: string;

  private destroy$$ = new Subject<void>();

  public project$ = this.store.select(viewerSelector.vProject);

  private room!: Room;

  public videoTracks: RemoteVideoTrack[] = [];
  public audioSources = new Map();

  public watching = false;

  public audioDestination!: MediaStreamAudioDestinationNode;
  public audioContext!: AudioContext;

  @ViewChildren('videoElement') videoElements!: QueryList<
    ElementRef<HTMLVideoElement>
  >;

  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  constructor(
    private api: ApiService,
    private store: Store<AppState>,
    private titleService: Title
  ) {
    this.project$.pipe(takeUntil(this.destroy$$)).subscribe((project) => {
      if (project) this.titleService.setTitle(project.title + ' - Melvin');
    });
  }

  async ngOnInit() {
    this.audioContext = new AudioContext();
    this.audioDestination = this.audioContext.createMediaStreamDestination();

    this.store.dispatch(viewerActions.viewerLogin({ token: this.token }));

    // const result = await firstValueFrom( this.api.viewerLogin(this.token));

    this.room = new Room();

    setTimeout(async () => {
      const res = await firstValueFrom(
        this.api.authenticateViewerLivekit(this.token)
      );

      await this.room.connect(res.url, res.authToken, { autoSubscribe: true });

      this.room.on(RoomEvent.AudioPlaybackStatusChanged, (status) => {
        console.log('Audio playback status changed:', status);
      });

      this.room.on(
        RoomEvent.TrackSubscribed,
        (track, publication, participant) => {
          if (track.kind === 'audio') {
            this._handleIncomingAudio(track as RemoteTrack, participant.sid);
          }

          if (track.kind === 'video') {
            this.videoTracks.push(track as RemoteVideoTrack);
          }
        }
      );

      this.room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) {
            const track = publication.track;

            if (track.kind === 'audio') {
              this._handleIncomingAudio(track as RemoteTrack, participant.sid);
            }

            if (track.kind === 'video') {
              this.videoTracks.push(track as RemoteVideoTrack);
            }
          }
        });
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track, participant) => {
        this._removePublication(track);
      });

      // Backup, if the participant disconnects suddenly (due to network issues)
      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        for (const [entry] of this.audioSources) {
          if (entry.participantSid === participant.sid) {
            this._removePublication(entry.track);
          }
        }
      });
    }, 3000);
  }

  async onStartWatching() {
    if (this.audioContext.state === 'suspended') {
      console.log('Resuming audio context');
      await this.audioContext.resume();
    }

    try {
      await this.audioElement?.nativeElement.play();
      console.log('Starting audio playback');
    } catch (e) {
      console.error('Audio play failed:', e);
    }

    for (const { keeper } of this.audioSources.values()) {
      try {
        console.log('Playing keeper audio element:', keeper);
        await keeper.play();
      } catch (e) {
        console.warn('Keeper play failed:', e);
      }
    }
  }

  _handleIncomingAudio(track: RemoteTrack, participantSid: string) {
    const stream = new MediaStream([track.mediaStreamTrack]);

    // Chrome Workaround: Keeper-Audio
    const keeper = document.createElement('audio');
    keeper.srcObject = stream;
    keeper.muted = true;
    keeper.setAttribute('autoplay', '');
    keeper.setAttribute('playsinline', '');
    keeper.style.display = 'none';
    document.body.appendChild(keeper);

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.audioDestination);

    this.audioSources.set(track.sid, { source, track, keeper, participantSid });
    this.audioElement!.nativeElement.muted = false;
  }

  _removePublication(track: RemoteTrack) {
    if (track.kind === 'video') {
      try {
        const detachedElements = track.detach();
        detachedElements.forEach((el) => {
          try {
            el.srcObject = null;
          } catch {}
        });
      } catch {}

      this.videoTracks = this.videoTracks.filter((t) => t.sid !== track.sid);
    }

    if (track.kind === 'audio') {
      const entry = this.audioSources.get(track.sid);
      if (!entry) return;

      try {
        entry.source.disconnect();
      } catch (e) {
        /* ignore */
      }

      if (entry.track?.stop) {
        entry.track.stop();
      } else if (entry.track?.mediaStreamTrack) {
        entry.track.mediaStreamTrack.stop();
      }

      if (entry.keeper) {
        try {
          entry.keeper.srcObject = null;
          entry.keeper.remove();
        } catch {}
      }

      this.audioSources.delete(track.sid);

      if (this.audioSources.size === 0) {
        this.audioElement!.nativeElement.muted = true;
      }
    }
  }

  ngAfterViewInit() {
    this._attachVideoTracks();
    this.videoElements.changes.subscribe(() => {
      this._attachVideoTracks();
    });
  }

  _attachVideoTracks() {
    console.log(this.videoElements);
    this.videoElements.forEach((videoEl, i) => {
      const track = this.videoTracks[i];
      if (track && videoEl.nativeElement) {
        track.attach(videoEl.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
