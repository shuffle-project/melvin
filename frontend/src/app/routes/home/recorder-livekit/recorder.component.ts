import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import { LocalTrack } from 'livekit-client';
import { HeaderComponent } from '../../../components/header/header.component';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import { MediaSourceComponent } from './components/media-source/media-source.component';

import { ActivatedRoute } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { LiveKitService } from './liveKit.service';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
  imports: [
    MediaSourceComponent,
    HeaderComponent,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    DurationPipe,
    MatSlideToggleModule,
    LetDirective,
  ],
})
export class RecorderComponent implements OnInit, OnDestroy {
  @ViewChild('lalelu') lalelu!: ElementRef<HTMLDivElement>;
  @ViewChild('testWrapper') testWrapper!: ElementRef<HTMLDivElement>;

  public languages$ = this.store.select(configSelector.languagesConfig);

  loading = true;

  screensharingTracks: LocalTrack[] = [];
  @ViewChildren('screenSharingVideoElement')
  screenSharingVideoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  constructor(
    public dialog: MatDialog,
    private store: Store<AppState>,
    public livekitService: LiveKitService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.loading = false;

    const projectId = this.route.snapshot.paramMap.get('id');
    // TODO set projectId? not known yet
    this.livekitService.init(projectId!);

    // this.room.emit('chatMessage', 'hello from angular');

    // Also subscribe to tracks published before participant joined
    // this.room.remoteParticipants.forEach((participant) => {
    //   participant.trackPublications.forEach((publication) => {
    //     publication.setSubscribed(true);
    //   });
    // });
  }

  ngOnDestroy(): void {
    this.livekitService.destroy();
  }

  async onAddAudioSource() {
    this.livekitService.addAudioTrack();
  }

  async onAddVideoSource() {
    await this.livekitService.addVideoTrack();
  }

  async onAddScreenSharingSource() {
    await this.livekitService.addScreenTrack();
  }

  onClickStartSession() {
    this.livekitService.startSession();
  }

  onClickStopSession() {
    this.livekitService.stopSession();
  }

  onClickTogglePauseSession() {
    if (this.livekitService.sessionPaused) {
      this.livekitService.resumeSession();
    } else {
      this.livekitService.pauseSession();
    }
  }
}
