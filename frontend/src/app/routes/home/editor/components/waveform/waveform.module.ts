import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetDirective, PushPipe } from '@ngrx/component';
import { SharedModule } from '../../../../../modules/shared/shared.module';

import { ResizeDirective } from './resize/resize.directive';
import { WaveformCanvasComponent } from './waveform-canvas/waveform-canvas.component';
import { WaveformCaptionsComponent } from './waveform-captions/waveform-captions.component';
import { WaveformComponent } from './waveform.component';
import { WaveformService } from './waveform.service';

@NgModule({
    imports: [
    CommonModule,
    LetDirective,
    PushPipe,
    MatTooltipModule,
    SharedModule,
    MatProgressBarModule,
    WaveformComponent,
    ResizeDirective,
    WaveformCanvasComponent,
    WaveformCaptionsComponent,
],
    exports: [WaveformComponent],
    providers: [WaveformService],
})
export class WaveformModule {}
