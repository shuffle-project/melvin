import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { lastValueFrom, Observable, Subject, take } from 'rxjs';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import * as authActions from 'src/app/store/actions/auth.actions';
import * as notificationsActions from '../../store/actions/notifications.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as notificationsSelectors from '../../store/selectors/notifications.selector';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('100ms', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnDestroy, OnInit {
  isLoggedIn$: Observable<boolean>;
  isMenuOpen: boolean = false;

  private destroy$$ = new Subject<void>();

  totalUnreadNotifications$: Observable<number>;
  recentNotifications$: Observable<readonly NotificationEntity[]>;

  constructor(private store: Store, private router: Router) {
    this.isLoggedIn$ = store.select(authSelectors.selectIsLoggedIn);

    this.totalUnreadNotifications$ = store.select(
      notificationsSelectors.selectTotalUnreadNotifications
    );

    this.recentNotifications$ = store.select(
      notificationsSelectors.selectRecentNotifications
    );
  }

  async ngOnInit() {
    const userId = await lastValueFrom(
      this.store.select(authSelectors.selectUserId).pipe(take(1))
    );

    if (userId) {
      this.store.dispatch(
        notificationsActions.findRecent({ userId: userId, limit: 3 })
      );
    }
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onClickNotificationRead(notificationId: string, event: Event) {
    event.stopPropagation();
    this.store.dispatch(
      notificationsActions.updateFromHeader({
        idToUpdate: notificationId,
        updateDto: { read: true },
      })
    );
  }

  openProfile() {
    this.router.navigate(['/home/profile']);
  }

  logout() {
    this.store.dispatch(authActions.logout());
  }
}
