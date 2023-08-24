import { CdkDrag } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { HeaderModule } from '../../../components/header/header.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';
import { CaptionsSettingsDialogComponent } from './components/captions-settings-dialog/captions-settings-dialog.component';
import { HighlightPipe } from './components/highlight-pipe/highlight.pipe';
import { InfoboxComponent } from './components/infobox/infobox.component';
import { ControlsComponent } from './components/player/controls/controls.component';
import { PlayerComponent } from './components/player/player.component';
import { VideoContainerComponent } from './components/player/video-container/video-container.component';
import { TranscriptComponent } from './components/transcript/transcript.component';
import { ViewerRoutingModule } from './viewer-routing.module';
import { ViewerComponent } from './viewer.component';

@NgModule({
  declarations: [
    ViewerComponent,
    AdjustLayoutDialogComponent,
    TranscriptComponent,
    InfoboxComponent,
    PlayerComponent,
    HighlightPipe,
    CaptionsSettingsDialogComponent,
    ControlsComponent,
    VideoContainerComponent,
  ],
  imports: [
    CommonModule,
    ViewerRoutingModule,
    HeaderModule,
    SharedModule,
    MatRadioModule,
    MatGridListModule,
    ScrollingModule,
    CdkDrag,
  ],
})
export class ViewerModule {}
