import { AfterViewInit, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AsrServiceConfig } from 'src/app/services/api/entities/config.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../../store/selectors/config.selector';
import { ASRGroup } from '../../dialog-create-project.interfaces';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LetDirective } from '@ngrx/component';
import { WrittenOutLanguagePipe } from '../../../../../../pipes/written-out-language-pipe/written-out-language.pipe';

@Component({
  selector: 'app-project-asr-form',
  styleUrls: ['./project-asr-form.component.scss'],
  templateUrl: './project-asr-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    LetDirective,
    MatSelectModule,
    MatOptionModule,
    WrittenOutLanguagePipe,
  ],
})
export class ProjectASRFormComponent implements AfterViewInit {
  @Input() asrGroup!: FormGroup<ASRGroup>;

  public asrServices$ = this.store.select(configSelector.asrServiceConfig);
  private destroy$$ = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngAfterViewInit() {
    const language = this.asrGroup.controls.language;
    const asrVendor = this.asrGroup.controls.asrVendor;

    this.asrGroup.controls.activated.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((activated) => {
        if (activated) {
          asrVendor.enable();
          if (asrVendor.value !== '') language.enable();
          language.addValidators([Validators.required]);
          asrVendor.addValidators([Validators.required]);
        } else {
          language.removeValidators([Validators.required]);
          asrVendor.removeValidators([Validators.required]);
          language.disable();
          asrVendor.disable();
        }
        this.asrGroup.updateValueAndValidity();
      });

    this.asrGroup.controls.asrVendor.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((valueChange) => {
        if (
          valueChange !== '' &&
          language.disabled &&
          this.asrGroup.controls.activated.value
        ) {
          language.enable();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  getLanguages(asrServices: AsrServiceConfig[]) {
    const selectedService = asrServices.find(
      (s) => s.asrVendor === this.asrGroup.value.asrVendor
    );
    return selectedService?.languages;
  }
}
