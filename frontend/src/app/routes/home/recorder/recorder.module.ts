import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '../../../components/header/header.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { AddSourceDialogComponent } from './dialogs/add-source-dialog/add-source-dialog.component';
import { RecorderRoutingModule } from './recorder-routing.module';
import { RecorderComponent } from './recorder.component';

@NgModule({
  declarations: [
    RecorderComponent,
    AddSourceDialogComponent,
    MediaSourceComponent,
  ],
  imports: [CommonModule, RecorderRoutingModule, HeaderModule, SharedModule],
})
export class RecorderModule {}
