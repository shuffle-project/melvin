import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '../../../components/header/header.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { MediaSourceComponent } from './components/media-source/media-source.component';
import { AddAudioSourceComponent } from './dialogs/add-audio-source/add-audio-source.component';
import { AddScreensharingSourceComponent } from './dialogs/add-screensharing-source/add-screensharing-source.component';
import { AddVideoSourceComponent } from './dialogs/add-video-source/add-video-source.component';
import { RecorderRoutingModule } from './recorder-routing.module';
import { RecorderComponent } from './recorder.component';

@NgModule({
  declarations: [
    RecorderComponent,
    MediaSourceComponent,
    AddVideoSourceComponent,
    AddAudioSourceComponent,
    AddScreensharingSourceComponent,
  ],
  imports: [CommonModule, RecorderRoutingModule, HeaderModule, SharedModule],
})
export class RecorderModule {}
