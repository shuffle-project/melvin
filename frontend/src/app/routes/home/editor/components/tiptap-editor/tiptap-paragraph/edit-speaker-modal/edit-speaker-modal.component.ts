import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
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
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SpeakerEntity } from '../../../../../../../services/api/entities/transcription.entity';
import * as transcriptionsActions from '../../../../../../../store/actions/transcriptions.actions';
import * as transcriptionsSelectors from '../../../../../../../store/selectors/transcriptions.selector';

interface EditSpeakerEntity extends SpeakerEntity {
  editMode: boolean;
}

interface SpeakerForm {
  id: FormControl<string>;
  name: FormControl<string>;
}

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
  ],
})
export class EditSpeakerModalComponent implements OnInit, OnDestroy {
  @Output() changeSpeakerEvent = new EventEmitter<SpeakerEntity>();

  availableSpeaker$!: Observable<SpeakerEntity[]>;
  newSpeakerForm = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, this.nameExistsValidator()],
  });

  // ___________

  formGroup = new FormGroup({
    speakers: new FormArray<FormGroup<SpeakerForm>>([]),
  });

  private destroy$$ = new Subject<void>();
  speakers!: EditSpeakerEntity[];
  transcriptionId!: string;

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      if (control?.dirty && control.hasError('required')) return true;
      if (control.hasError('nameExists')) return true;
      return false;
    },
  };

  constructor(private store: Store) {}

  get speakersFormArray() {
    return this.formGroup.controls['speakers'] as FormArray;
  }

  // TODO find new approach
  // TODO New Approach -> Everything is a FormGroup
  // getSpeakerFormControl(speakerId: string) {
  //   console.log(speakerId);
  //   const control = this.speakersFormArray.controls.find(
  //     (c) => c.value.id === speakerId
  //   ) as FormGroup<SpeakerForm>;

  //   console.log(control);
  //   return control;
  // }

  ngOnInit(): void {
    this.store
      .select(transcriptionsSelectors.selectTranscriptionId)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((id) => {
        this.transcriptionId = id;
      });

    this.availableSpeaker$ = this.store.select(
      transcriptionsSelectors.selectAvailableSpeakers
    );

    this.availableSpeaker$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((speakers) => {
        this.speakers = speakers.map((speaker) => ({
          ...speaker,
          editMode: false,
        }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onSelectSpeaker(speaker: SpeakerEntity) {
    // this.changeSpeakerEvent.emit(speaker);
  }

  onStartEditMode(speaker: SpeakerEntity) {
    this.speakers = this.speakers.map((s) => {
      return s.id === speaker.id ? { ...s, editMode: true } : s;
    });
  }

  onDeleteSpeaker(speaker: SpeakerEntity) {
    //TODO add logic, if speaker is used elsewhere

    this.store.dispatch(
      transcriptionsActions.removeSpeaker({
        transcriptionId: this.transcriptionId,
        speakerId: speaker.id,
      })
    );
  }

  onUpdateSpeaker(speaker: SpeakerEntity) {
    console.log(speaker);
    console.log(this.speakersFormArray);
    return;

    // const nameDuplication = this.speakers.some((s) => s.name === newName);

    // if (nameDuplication || newName === '') {
    //   return;
    // }

    // if (speaker.name === '') {
    //   this.speakers = this.speakers.filter((s) => s.id !== speaker.id);

    //   this.store.dispatch(
    //     transcriptionsActions.createSpeakers({
    //       transcriptionId: this.transcriptionId,
    //       createSpeakersDto: { names: [newName] },
    //     })
    //   );
    // } else {
    //   this.store.dispatch(
    //     transcriptionsActions.updateSpeaker({
    //       transcriptionId: this.transcriptionId,
    //       speakerId: speaker.id,
    //       updateSpeakerDto: { name: newName },
    //     })
    //   );
    // }
  }

  onAbortEditMode(speaker: SpeakerEntity) {
    if (speaker.name === '') {
      this.speakers = this.speakers.filter((s) => s.id !== speaker.id);
    } else {
      this.speakers = this.speakers.map((s) => {
        return s.id === speaker.id ? { ...s, editMode: false } : s;
      });
    }
  }

  onAddSpeakerForm() {
    const newEmptySpeaker: EditSpeakerEntity = {
      id: crypto.randomUUID(),
      name: '',
      updatedAt: Date.now().toString(),
      editMode: true,
    };

    this.speakers.push(newEmptySpeaker);

    const speakerForm = new FormGroup<SpeakerForm>({
      id: new FormControl<string>(newEmptySpeaker.id, { nonNullable: true }),
      name: new FormControl<string>(newEmptySpeaker.name, {
        nonNullable: true,
        validators: [Validators.required, this.nameExistsValidator()],
      }),
    });

    this.speakersFormArray.push(speakerForm);
  }

  // async onAddSpeaker(newSpeaker: string) {
  //   if (this.newSpeakerForm.invalid) {
  //     this.newSpeakerForm.markAllAsTouched();
  //   } else {
  //     const transcriptionId = await firstValueFrom(
  //       this.store.select(transcriptionsSelectors.selectTranscriptionId)
  //     );
  //     const createSpeakersDto = { names: [newSpeaker] };
  //     this.store.dispatch(
  //       transcriptionsActions.createSpeakers({
  //         transcriptionId: transcriptionId,
  //         createSpeakersDto,
  //       })
  //     );
  //   }
  // }

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
