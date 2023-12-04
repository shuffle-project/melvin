import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import * as authSelectors from '../../../store/selectors/auth.selector';
import { LetDirective } from '@ngrx/component';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [HeaderComponent, LetDirective],
})
export class ProfileComponent implements OnInit {
  user$!: Observable<AuthUser | null>;

  newNotifications$!: Observable<ReadonlyArray<Notification>>;
  oldNotifications$!: Observable<ReadonlyArray<Notification>>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.user$ = this.store.select(authSelectors.selectUser);
  }

  getTime(timestamp: string) {
    return new Date(timestamp).getTime();
  }
}
