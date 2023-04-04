import { AfterViewInit, Component, Input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, take, takeUntil } from 'rxjs';
import { Language } from 'src/app/services/api/entities/config.entity';
import { AppState } from '../../../../../../../app/store/app.state';
import * as configSelector from '../../../../../../store/selectors/config.selector';
import {
  LiveGroup,
  MetadataGroup,
} from '../../dialog-create-project.interfaces';
import {
  findFittingVendorLanguage,
  getSelectedVendorLanguage,
} from '../../dialog-create-project.utils';

@Component({
  selector: 'app-project-live-form',
  styleUrls: ['./project-live-form.component.scss'],
  templateUrl: './project-live-form.component.html',
})
export class ProjectLiveFormComponent implements AfterViewInit {
  @Input() liveGroup!: FormGroup<LiveGroup>;
  @Input() metadataGroup!: FormGroup<MetadataGroup>;

  public languages$ = this.store.select(configSelector.languagesConfig);
  public asrServices$ = this.store.select(configSelector.asrServiceConfig);
  private destroy$$ = new Subject<void>();
  notIdenticalLanguages = false;

  constructor(private store: Store<AppState>) {}

  ngAfterViewInit() {
    const { settings, asrGroup } = this.liveGroup.controls;
    const language = settings.controls.language;

    this.liveGroup.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((liveGroupValues) => {
        const selectedVendorLanguage = getSelectedVendorLanguage(asrGroup);
        const asrGroupValid =
          asrGroup.enabled && asrGroup.value.activated && asrGroup.valid;
        const liveLanguageExist = language.value !== '';
        const vendorLanguageIsDifferent =
          language.value !== selectedVendorLanguage;

        if (asrGroupValid && liveLanguageExist && vendorLanguageIsDifferent) {
          this.notIdenticalLanguages = true;
        } else {
          this.notIdenticalLanguages = false;
        }
      });

    asrGroup.controls.asrVendor.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((vendor) => {
        if (vendor === '') return;
        if (language.value === '') return;
        if (asrGroup.value.language !== '') return;

        let vendorLanguages: Language[] = [];
        this.asrServices$.pipe(take(1)).subscribe((allVendors) => {
          const selectedVendor = allVendors.find((o) => o.asrVendor === vendor);
          vendorLanguages = selectedVendor?.languages || [];
        });

        const fittingLanguage = findFittingVendorLanguage(
          vendorLanguages,
          language.value
        );
        if (fittingLanguage)
          asrGroup.controls.language.setValue(fittingLanguage);
      });
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }
}
