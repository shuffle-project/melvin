import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  MAT_LEGACY_FORM_FIELD_DEFAULT_OPTIONS as MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatLegacyFormFieldModule as MatFormFieldModule,
} from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { LetModule, PushModule } from '@ngrx/component';
import { WrittenOutLanguageModulePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language-pipe.module';
import { FeatureEnabledPipeModule } from '../../pipes/feature-enabled-pipe/feature-enabled-pipe.module';
import { LanugageCodePipeModule } from '../../pipes/language-code-pipe/language-code-pipe.module';
import { DurationPipeModule } from './../../pipes/duration-pipe/duration-pipe.module';
import { FormatDatePipeModule } from './../../pipes/format-date-pipe/format-date-pipe.module';
import { ProjectStatusPipeModule } from './../../pipes/project-status-pipe/project-status-pipe.module';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatBadgeModule,
    MatSortModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    LetModule,
    PushModule,
    MatDividerModule,
    FormatDatePipeModule,
    DurationPipeModule,
    LanugageCodePipeModule,
    ProjectStatusPipeModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatExpansionModule,
    MatTabsModule,
    MatSliderModule,
    WrittenOutLanguageModulePipe,
    MatProgressBarModule,
    MatSlideToggleModule,
    FeatureEnabledPipeModule,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class SharedModule {}
