import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, lastValueFrom, take } from 'rxjs';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import * as authActions from 'src/app/store/actions/auth.actions';
import { toggleDarkMode } from '../../store/actions/config.actions';
import * as notificationsActions from '../../store/actions/notifications.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as configSelector from '../../store/selectors/config.selector';
import * as notificationsSelectors from '../../store/selectors/notifications.selector';
import { FeatureEnabledPipe } from '../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationComponent } from '../notification/notification.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { LogoComponent } from '../logo/logo.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LetDirective, PushPipe } from '@ngrx/component';

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
    standalone: true,
    imports: [
    LetDirective,
    MatToolbarModule,
    LogoComponent,
    RouterLink,
    MatIconModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    NotificationComponent,
    MatTooltipModule,
    PushPipe,
    FeatureEnabledPipe
],
})
export class HeaderComponent implements OnDestroy, OnInit {
  @Input() viewer = false;

  isLoggedIn$: Observable<boolean>;
  isMenuOpen: boolean = false;

  private destroy$$ = new Subject<void>();

  public darkMode$ = this.store.select(configSelector.darkMode);

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

  onToggleChangeDarkMode() {
    this.store.dispatch(toggleDarkMode());
  }
}
