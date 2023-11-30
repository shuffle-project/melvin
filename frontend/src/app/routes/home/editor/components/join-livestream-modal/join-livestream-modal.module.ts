import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { JoinLivestreamModalComponent } from './join-livestream-modal.component';

@NgModule({
    imports: [CommonModule, SharedModule, JoinLivestreamModalComponent],
    exports: [JoinLivestreamModalComponent],
})
export class JoinLivestreamModalModule {}
