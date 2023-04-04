import { Component, Input } from '@angular/core';
import { CaptionEntity } from '../../../../../../services/api/entities/caption.entity';

@Component({
  selector: 'app-caption',
  templateUrl: './caption.component.html',
  styleUrls: ['./caption.component.scss'],
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
