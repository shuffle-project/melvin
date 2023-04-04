import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { JoinLivestreamModalComponent } from './join-livestream-modal.component';

@NgModule({
  declarations: [JoinLivestreamModalComponent],
  imports: [CommonModule, SharedModule],
  exports: [JoinLivestreamModalComponent],
})
export class JoinLivestreamModalModule {}
