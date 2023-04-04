import { Component, Input } from '@angular/core';
import { AvatarUser } from './avatar/avatar.component';

@Component({
  selector: 'app-avatar-group',
  templateUrl: './avatar-group.component.html',
  styleUrls: ['./avatar-group.component.scss'],
})
export class AvatarGroupComponent {
  @Input() users!: AvatarUser[];
  @Input() outlineColor = 'var(--color-white)';
  @Input() editorView = false;

  get width(): number {
    switch (this.users.length) {
      case 1:
        return 40;
      case 2:
        return 60;
      default:
        return 106;
    }
  }

  get avatars(): AvatarUser[] {
    return this.users.slice(0, 3);
  }

  get moreCount(): number {
    return this.users.length - 3;
  }
}
