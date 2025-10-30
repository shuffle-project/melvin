import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
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
import { Editor } from '@tiptap/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { SpeakerEntity } from '../../../../../../../services/api/entities/transcription.entity';
import * as transcriptionsActions from '../../../../../../../store/actions/transcriptions.actions';
import * as transcriptionsSelectors from '../../../../../../../store/selectors/transcriptions.selector';

interface SpeakerValues {
  id: string;
  name: string;
  editMode: boolean;
}

interface SpeakerFormGroup {
  id: FormControl<string>;
  name: FormControl<string>;
  editMode: FormControl<boolean>;
}

@Component({
  selector: 'app-edit-speaker-modal',
  templateUrl: './edit-speaker-modal.component.html',
  styleUrls: ['./edit-speaker-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @Output() changeSpeakerEvent = new EventEmitter<string>();
  @Input() editor!: Editor;

  availableSpeaker$!: Observable<SpeakerEntity[]>;

  formGroup = this.fb.group({
    speakers: this.fb.array([]),
  });

  private destroy$$ = new Subject<void>();
  private transcriptionId!: string;

  private oldNames = new Map<string, string>();

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      if (control?.dirty && control.hasError('required')) return true;
      if (control?.dirty && control.hasError('nameExists')) return true;
      return false;
    },
  };

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private alertService: AlertService,
    private deleteService: DeleteConfirmationService
  ) {}

  get speakersFormArray() {
    return this.formGroup.controls['speakers'] as FormArray;
  }

  get speakerFormGroups() {
    return this.speakersFormArray.controls as FormGroup[];
  }

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
        this.speakersFormArray.controls.forEach((control, i) => {
          const speakerIndex = speakers.findIndex(
            (s) => s.id === control.value.id
          );

          if (speakerIndex === -1) {
            this.speakersFormArray.removeAt(i);
            this.changeDetector.detectChanges();
          }
        });

        speakers.forEach((speaker) => {
          const speakerIndex = this.speakersFormArray.controls.findIndex(
            (c) => c.value.id === speaker.id
          );

          if (speakerIndex !== -1) {
            this.speakersFormArray.controls[speakerIndex].patchValue({
              name: speaker.name,
              editMode: false,
            });
          } else {
            this._pushNewSpeakerForm(speaker, false);
          }
        });
      });
  }

  _pushNewSpeakerForm(speaker: SpeakerEntity, editMode: boolean) {
    const newSpeakerForm = this.fb.group({
      id: this.fb.control<string>(speaker.id, { nonNullable: true }),
      name: this.fb.control<string>(speaker.name, {
        nonNullable: true,
        validators: [Validators.required, this.nameExistsValidator()],
      }),
      editMode: this.fb.control<boolean>(editMode, { nonNullable: true }),
    });
    this.speakersFormArray.push(newSpeakerForm);
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onSelectSpeaker(speaker: SpeakerValues) {
    this.changeSpeakerEvent.emit(speaker.id);
  }

  onStartEditMode(speaker: SpeakerValues) {
    if (speaker.name !== '') {
      this.oldNames.set(speaker.id, speaker.name);
    }

    const speakerIndex = this.speakersFormArray.controls.findIndex(
      (s) => s.value.id === speaker.id
    );

    this.speakersFormArray.controls[speakerIndex].patchValue({
      editMode: true,
    });
  }

  async onDeleteSpeaker(speaker: SpeakerValues) {
    if (this.speakersFormArray.controls.length === 1) {
      this.alertService.error(
        $localize`:@@editSpeakerMenuAtLeastOneProjectError:At least one speaker is required.`
      );
      return;
    }

    const speakerUsedArray: number[] = [];
    let lastNodeSpeakerId: string = '';
    this.editor.state.doc.content.forEach((node, pos) => {
      if (
        node.attrs['speakerId'] !== null &&
        lastNodeSpeakerId !== node.attrs['speakerId']
      ) {
        lastNodeSpeakerId = node.attrs['speakerId'];

        if (node.attrs['speakerId'] === speaker.id) {
          speakerUsedArray.push(pos);
        }
      }

      if (
        node.attrs['speakerId'] !== null &&
        node.attrs['speakerId'] === speaker.id
      ) {
        speakerUsedArray.push(pos);
      }

      if (
        node.attrs['speakerId'] === null &&
        lastNodeSpeakerId === speaker.id
      ) {
        speakerUsedArray.push(pos);
      }
    });

    if (speakerUsedArray.length > 1) {
      const confirmation = await this.deleteService.deleteSpeaker(speaker.name);

      if (!confirmation) return;
    }

    speakerUsedArray.forEach((pos) => {
      const { state, view } = this.editor!;
      const { tr } = state;

      const paragraph = this.editor.state.doc.nodeAt(pos);

      if (paragraph?.type.name === 'paragraph') {
        const newAttrs = { ...paragraph.attrs, speakerId: null };
        tr.setNodeMarkup(pos, undefined, newAttrs);

        view.dispatch(tr);
      }
    });

    this.store.dispatch(
      transcriptionsActions.removeSpeaker({
        transcriptionId: this.transcriptionId,
        speakerId: speaker.id,
      })
    );
  }

  onUpdateSpeaker(speaker: FormGroup<SpeakerFormGroup>) {
    if (!speaker.controls['name'].valid) return;

    if (speaker.getRawValue().id.startsWith('edit-')) {
      const speakerIndex = this.speakersFormArray.controls.findIndex(
        (e) => e.getRawValue().id === speaker.getRawValue().id
      );

      this.speakersFormArray.removeAt(speakerIndex);

      this.store.dispatch(
        transcriptionsActions.createSpeakers({
          transcriptionId: this.transcriptionId,
          createSpeakersDto: { names: [speaker.getRawValue().name] },
        })
      );
    } else {
      this.store.dispatch(
        transcriptionsActions.updateSpeaker({
          transcriptionId: this.transcriptionId,
          speakerId: speaker.getRawValue().id,
          updateSpeakerDto: { name: speaker.getRawValue().name },
        })
      );
    }

    this.oldNames.delete(speaker.getRawValue().id);
  }

  onAbortEditMode(speaker: SpeakerValues) {
    const oldSpeakerName = this.oldNames.get(speaker.id);

    const speakerIndex = this.speakersFormArray.controls.findIndex(
      (s) => s.value.id === speaker.id
    );

    if (oldSpeakerName) {
      this.speakersFormArray.controls[speakerIndex].patchValue({
        name: oldSpeakerName,
        editMode: false,
      });

      this.oldNames.delete(speaker.id);
    } else {
      this.speakersFormArray.removeAt(speakerIndex);
    }
  }

  onAddSpeakerForm() {
    const newEmptySpeaker: SpeakerEntity = {
      id: 'edit-' + crypto.randomUUID(),
      name: '',
      updatedAt: Date.now().toString(),
    };

    this._pushNewSpeakerForm(newEmptySpeaker, true);
  }

  nameExistsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const speakerName = control.value;
      if (!speakerName) return null;

      return this.speakersFormArray.controls.filter(
        (s) => s.getRawValue().name === speakerName
      ).length !== 1
        ? { nameExists: true }
        : null;
    };
  }
}
