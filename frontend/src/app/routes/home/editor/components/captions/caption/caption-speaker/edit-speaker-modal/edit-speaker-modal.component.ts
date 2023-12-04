import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { CaptionEntity } from '../../../../../../../../services/api/entities/caption.entity';
import { SpeakerEntity } from '../../../../../../../../services/api/entities/transcription.entity';
import * as captionsActions from '../../../../../../../../store/actions/captions.actions';
import * as transcriptionsActions from '../../../../../../../../store/actions/transcriptions.actions';
import * as transcriptionsSelectors from '../../../../../../../../store/selectors/transcriptions.selector';
import { PushPipe } from '@ngrx/component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';


@Component({
    selector: 'app-edit-speaker-modal',
    templateUrl: './edit-speaker-modal.component.html',
    styleUrls: ['./edit-speaker-modal.component.scss'],
    standalone: true,
    imports: [
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    PushPipe
],
})
export class EditSpeakerModalComponent implements OnInit, OnDestroy {
  @Input() caption!: CaptionEntity;
  @Output() closeMatMenuEvent = new EventEmitter();
  availableSpeaker$!: Observable<SpeakerEntity[]>;
  addSpeakerMode = false;
  newSpeakerForm = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, this.nameExistsValidator()],
  });
  speakers!: SpeakerEntity[];
  speakerSub!: Subscription;

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      if (control?.dirty && control.hasError('required')) return true;
      if (control.hasError('nameExists')) return true;
      return false;
    },
  };

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.availableSpeaker$ = this.store.select(
      transcriptionsSelectors.selectAvailableSpeakers
    );

    this.speakerSub = this.availableSpeaker$.subscribe((speakers) => {
      this.speakers = speakers;
    });
  }

  ngOnDestroy(): void {
    this.speakerSub.unsubscribe();
  }

  changeSpeaker(caption: CaptionEntity, speaker: SpeakerEntity) {
    this.store.dispatch(
      captionsActions.update({
        id: caption.id,
        updateDto: { speakerId: speaker.id, lockedBy: null },
      })
    );
  }

  onAddSpeaker(caption: CaptionEntity, newSpeaker: string) {
    const createSpeakersDto = { names: [newSpeaker] };
    this.store.dispatch(
      transcriptionsActions.createSpeakers({
        transcriptionId: caption.transcription,
        createSpeakersDto,
      })
    );
  }

  onAddSpeakerMode() {
    this.addSpeakerMode = true;
  }

  nameExistsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const speakerName = control.value;
      if (!speakerName) return null;
      return this.speakers.find((speaker) => speaker.name === speakerName)
        ? { nameExists: true }
        : null;
    };
  }

  onNewSpeakerInvalid() {
    if (this.newSpeakerForm.hasError('required')) {
      return $localize`:@@editSpeakerModalNameRequiredError:You must enter a name`;
    }

    return this.newSpeakerForm.hasError('nameExists')
      ? $localize`:@@editSpeakerModalNameAlreadyExists:Name already exists`
      : '';
  }
}
