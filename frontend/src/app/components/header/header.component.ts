import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, lastValueFrom, take } from 'rxjs';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import * as authActions from 'src/app/store/actions/auth.actions';
import { FeatureEnabledPipe } from '../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import * as notificationsActions from '../../store/actions/notifications.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as configSelector from '../../store/selectors/config.selector';
import * as notificationsSelectors from '../../store/selectors/notifications.selector';
import { NotificationComponent } from '../notification/notification.component';

import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LetDirective, PushPipe } from '@ngrx/component';
import { environment } from 'src/environments/environment';
import * as configActions from '../../store/actions/config.actions';
import { ColorTheme } from '../../store/reducers/config.reducer';
import { LogoComponent } from '../logo/logo.component';

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
  imports: [
    LetDirective,
    MatToolbarModule,
    LogoComponent,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    NotificationComponent,
    MatTooltipModule,
    PushPipe,
    FeatureEnabledPipe,
    MatDivider,
  ],
})
export class HeaderComponent implements OnDestroy, OnInit {
  @Input() editorView: boolean = false;
  public colorThemeENUM = ColorTheme;

  feedbackLink = environment.features.feedbackLink;

  isLoggedIn$: Observable<boolean>;
  isMenuOpen: boolean = false;

  private destroy$$ = new Subject<void>();

  public colorTheme$ = this.store.select(configSelector.colorTheme);

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

  onChangeColorTheme(colorTheme: ColorTheme) {
    this.store.dispatch(configActions.changeColorTheme({ colorTheme }));
  }
}
