import { AfterViewInit, Component, Input } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AsrServiceConfig } from 'src/app/services/api/entities/config.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../../store/selectors/config.selector';
import { ASRGroup } from '../../dialog-create-project.interfaces';

@Component({
  selector: 'app-project-asr-form',
  styleUrls: ['./project-asr-form.component.scss'],
  templateUrl: './project-asr-form.component.html',
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