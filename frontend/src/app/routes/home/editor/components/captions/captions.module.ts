import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TimeDifferencePipeModule } from '../../../../../pipes/time-difference-pipe/time-difference-pipe.module';
import { CaptionModule } from './caption/caption.module';
import { CaptionsComponent } from './captions.component';
import { EditSpeakerModalComponent } from './edit-speaker-modal/edit-speaker-modal.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ScrollingModule,
        MatIconModule,
        ExperimentalScrollingModule,
        TimeDifferencePipeModule,
        CaptionModule,
        CaptionsComponent, EditSpeakerModalComponent,
    ],
    exports: [CaptionsComponent],
})
export class CaptionsModule {}
