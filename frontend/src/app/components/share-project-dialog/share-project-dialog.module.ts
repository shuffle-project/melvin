import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../modules/shared/shared.module';
import { AlertModule } from '../../services/alert/alert.module';
import { AvatarModule } from '../avatar-group/avatar/avatar.module';
import { ShareProjectDialogComponent } from './share-project-dialog.component';

@NgModule({
  declarations: [ShareProjectDialogComponent],
  imports: [
    CommonModule,
    SharedModule,
    AvatarModule,
    ClipboardModule,
    AlertModule,
  ],
  exports: [ShareProjectDialogComponent],
})
export class ShareProjectDialogModule {}
