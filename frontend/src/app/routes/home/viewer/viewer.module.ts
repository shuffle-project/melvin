import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { HeaderModule } from '../../../components/header/header.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';
import { ViewerRoutingModule } from './viewer-routing.module';
import { ViewerComponent } from './viewer.component';
import { TranscriptComponent } from './components/transcript/transcript.component';
import { InfoboxComponent } from './components/infobox/infobox.component';
import { ViewSelectionComponent } from './components/view-selection/view-selection.component';

@NgModule({
  declarations: [ViewerComponent, AdjustLayoutDialogComponent, TranscriptComponent, InfoboxComponent, ViewSelectionComponent],
  imports: [
    CommonModule,
    ViewerRoutingModule,
    HeaderModule,
    SharedModule,
    MatRadioModule,
  ],
})
export class ViewerModule {}
