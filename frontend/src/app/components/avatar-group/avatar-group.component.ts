import { Component, Input } from '@angular/core';
import { AvatarUser, AvatarComponent } from './avatar/avatar.component';

import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-avatar-group',
  templateUrl: './avatar-group.component.html',
  styleUrls: ['./avatar-group.component.scss'],
  standalone: true,
  imports: [MatMenuModule, AvatarComponent],
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

  get trackByFn(): (index: number, user: AvatarUser) => string {
    return (index: number, user: AvatarUser) => user.clientId || user.name;
  }

  get avatars(): AvatarUser[] {
    return this.users.slice(0, 3);
  }

  get moreCount(): number {
    return this.users.length - 3;
  }
}
