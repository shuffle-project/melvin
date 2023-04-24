import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { LetModule, PushModule } from '@ngrx/component';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { DurationPipeModule } from '../../../../../pipes/duration-pipe/duration-pipe.module';
import { ResizeDirective } from './resize/resize.directive';
import { WaveformCanvasComponent } from './waveform-canvas/waveform-canvas.component';
import { WaveformCaptionsComponent } from './waveform-captions/waveform-captions.component';
import { WaveformComponent } from './waveform.component';
import { WaveformService } from './waveform.service';

@NgModule({
  declarations: [
    WaveformComponent,
    ResizeDirective,
    WaveformCanvasComponent,
    WaveformCaptionsComponent,
  ],
  imports: [
    CommonModule,
    LetModule,
    PushModule,
    DurationPipeModule,
    MatTooltipModule,
    SharedModule,
    MatProgressBarModule,
  ],
  exports: [WaveformComponent],
  providers: [WaveformService],
})
export class WaveformModule {}
