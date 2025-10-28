import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { AuthUser } from '../../interfaces/auth.interfaces';
import { FileSizePipe } from '../../pipes/file-size-pipe/file-size.pipe';
import * as authSelectors from '../../store/selectors/auth.selector';
import { AvatarComponent } from '../avatar-group/avatar/avatar.component';

@Component({
  selector: 'app-user-info',
  imports: [
    AvatarComponent,
    LetDirective,
    PushPipe,
    FileSizePipe,
    MatProgressBar,
    NgClass,
  ],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss',
})
export class UserInfoComponent {
  user$: Observable<AuthUser | null> = this.store.select(
    authSelectors.selectUser
  );

  percentage$ = this.user$.pipe(
    map((user) => {
      if (!user || user.sizeLimit === -1) {
        return 0;
      }
      return (user.size / user.sizeLimit) * 100;
    })
  );

  color$ = this.percentage$.pipe(
    map((percentage) => {
      if (percentage < 70) {
        return 'primary';
      } else if (percentage < 90) {
        return 'orange';
      } else {
        return 'red';
      }
    })
  );

  constructor(private store: Store) {}
}
