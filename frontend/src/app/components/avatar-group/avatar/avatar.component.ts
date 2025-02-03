import { Component, Input, OnChanges } from '@angular/core';
import { LogoComponent } from '../../logo/logo.component';

export interface AvatarUser {
  name: string;
  clientId?: string;
  color?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  imports: [LogoComponent],
})
export class AvatarComponent implements OnChanges {
  @Input() user!: AvatarUser;
  @Input() outlineColor!: string;
  @Input() editorView = false;

  public letter: string = 'U';
  public backgroundColor: string = 'var(--color-background-grey)';
  public showLogo: boolean = false;

  ngOnChanges() {
    if (this.editorView) {
      this.backgroundColor = `rgb(var(--color-editor-user-${this.user.color}-rgb))`;
    } else if (this.user.name === 'System') {
      this.backgroundColor = 'rgba(var(--color-accent-rgb), 0.2)';
      this.showLogo = true;
    } else {
      this.backgroundColor = `linear-gradient(90deg, var(--color-light-yellow) 0%, var(--color-gold) 100%)`;
    }

    this.letter = this.user.name
      .split(' ')
      .filter((partOfName: string) => {
        return partOfName !== 'Prof.' && partOfName !== 'Dr.';
      })
      .slice(0, 1)
      .map((o: string) => o[0])
      .join('')
      .toUpperCase();
  }
}
