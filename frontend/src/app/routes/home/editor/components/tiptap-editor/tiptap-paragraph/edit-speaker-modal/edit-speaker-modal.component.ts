import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { SpeakerEntity } from '../../../../../../../services/api/entities/transcription.entity';
import * as transcriptionsActions from '../../../../../../../store/actions/transcriptions.actions';
import * as transcriptionsSelectors from '../../../../../../../store/selectors/transcriptions.selector';

@Component({
  selector: 'app-edit-speaker-modal',
  templateUrl: './edit-speaker-modal.component.html',
  styleUrls: ['./edit-speaker-modal.component.scss'],
  imports: [
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    PushPipe,
  ],
})
export class EditSpeakerModalComponent implements OnInit, OnDestroy {
  @Output() closeMatMenuEvent = new EventEmitter();

  @Output() changeSpeakerEvent = new EventEmitter<SpeakerEntity>();

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

  changeSpeaker(speaker: SpeakerEntity) {
    this.changeSpeakerEvent.emit(speaker);
    // this.store.dispatch(
    //   captionsActions.update({
    //     id: captionId,
    //     updateDto: { speakerId: speaker.id, lockedBy: null },
    //   })
    // );
  }

  async onAddSpeaker(newSpeaker: string) {
    if (this.newSpeakerForm.invalid) {
      this.newSpeakerForm.markAllAsTouched();
    } else {
      const transcriptionId = await firstValueFrom(
        this.store.select(transcriptionsSelectors.selectTranscriptionId)
      );
      const createSpeakersDto = { names: [newSpeaker] };
      this.store.dispatch(
        transcriptionsActions.createSpeakers({
          transcriptionId: transcriptionId,
          createSpeakersDto,
        })
      );
    }
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
