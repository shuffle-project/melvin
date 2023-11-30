import { Component, Input } from '@angular/core';
import { CaptionEntity } from '../../../../../../services/api/entities/caption.entity';
import { FeatureEnabledPipe } from '../../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { CaptionTimeComponent } from './caption-time/caption-time.component';
import { CaptionTextComponent } from './caption-text/caption-text.component';
import { CaptionActionsComponent } from './caption-actions/caption-actions.component';
import { CaptionSpeakerComponent } from './caption-speaker/caption-speaker.component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-caption',
    templateUrl: './caption.component.html',
    styleUrls: ['./caption.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        CaptionSpeakerComponent,
        CaptionActionsComponent,
        CaptionTextComponent,
        CaptionTimeComponent,
        FeatureEnabledPipe,
    ],
})
export class CaptionComponent {
  @Input() caption!: CaptionEntity;
  @Input() captionBefore!: CaptionEntity | null;
  @Input() captionAfter!: CaptionEntity | null;

  public isFocused: boolean = false;

  constructor() {}

  onFocus() {
    this.isFocused = true;
  }

  onFocusOut() {
    this.isFocused = false;
  }
}
