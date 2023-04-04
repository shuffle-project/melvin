import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../../modules/shared/shared.module';
import { TimeDifferencePipeModule } from '../../../../../../pipes/time-difference-pipe/time-difference-pipe.module';
import { CaptionActionsComponent } from './caption-actions/caption-actions.component';
import { CaptionDeleteConfirmModalComponent } from './caption-actions/caption-delete-confirm-modal/caption-delete-confirm-modal.component';
import { CaptionHistoryModalComponent } from './caption-actions/caption-history-modal/caption-history-modal.component';
import { CaptionSpeakerComponent } from './caption-speaker/caption-speaker.component';
import { EditSpeakerModalComponent } from './caption-speaker/edit-speaker-modal/edit-speaker-modal.component';
import { CaptionTextComponent } from './caption-text/caption-text.component';
import { CaptionTimeComponent } from './caption-time/caption-time.component';
import { CaptionComponent } from './caption.component';

@NgModule({
  declarations: [
    CaptionComponent,
    CaptionTextComponent,
    CaptionTimeComponent,
    CaptionSpeakerComponent,
    CaptionActionsComponent,
    EditSpeakerModalComponent,
    CaptionHistoryModalComponent,
    CaptionDeleteConfirmModalComponent,
  ],
  imports: [CommonModule, SharedModule, TimeDifferencePipeModule],
  exports: [CaptionComponent],
})
export class CaptionModule {}
