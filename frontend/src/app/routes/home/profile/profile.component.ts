import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import * as authSelectors from '../../../store/selectors/auth.selector';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
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
