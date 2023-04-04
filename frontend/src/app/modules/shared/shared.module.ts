import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveComponentModule } from '@ngrx/component';
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
    ReactiveComponentModule,
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
