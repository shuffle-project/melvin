import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../modules/shared/shared.module';
import { VideoPlayerMediaElementComponent } from './video-player-media-element/video-player-media-element.component';
import { VideoPlayerComponent } from './video-player.component';

@NgModule({
  declarations: [VideoPlayerComponent, VideoPlayerMediaElementComponent],
  imports: [CommonModule, SharedModule],
  exports: [VideoPlayerComponent],
})
export class VideoPlayerModule {}
