import { animate, style, transition, trigger } from '@angular/animations';
import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  DOCUMENT
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, lastValueFrom, map, take, takeUntil } from 'rxjs';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import * as authActions from 'src/app/store/actions/auth.actions';
import * as notificationsActions from '../../store/actions/notifications.actions';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as configSelector from '../../store/selectors/config.selector';
import * as notificationsSelectors from '../../store/selectors/notifications.selector';
import { NotificationComponent } from '../notification/notification.component';


import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LetDirective, PushPipe } from '@ngrx/component';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ConfigService } from 'src/app/services/config/config.service';
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
  ],
})
export class HeaderComponent implements OnDestroy, OnInit {
  @Input() editorView: boolean = false;
  public colorThemeENUM = ColorTheme;

  isLoggedIn$: Observable<boolean>;
  isMenuOpen: boolean = false;

  private destroy$$ = new Subject<void>();

  public colorTheme$ = this.store.select(configSelector.colorTheme);

  public disableLandingPage = this.configService.getDisableLandingPage();

  isNotUserEmailVerified$ = this.store
    .select(authSelectors.selectIsUserEmailVerified)
    .pipe(map((isVerified) => !isVerified));

  totalUnreadNotifications$: Observable<number>;
  recentNotifications$: Observable<readonly NotificationEntity[]>;

  constructor(
    private store: Store,
    private router: Router,
    private api: ApiService,
    private configService: ConfigService,
    private alertService: AlertService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2
  ) {
    this.isLoggedIn$ = store.select(authSelectors.selectIsLoggedIn);

    this.totalUnreadNotifications$ = store.select(
      notificationsSelectors.selectTotalUnreadNotifications
    );

    this.recentNotifications$ = store.select(
      notificationsSelectors.selectRecentNotifications
    );
  }

  async ngOnInit() {
    this.isNotUserEmailVerified$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((isNotVerified) => {
        if (isNotVerified) {
          this.renderer.addClass(this.document.body, 'banner');
        } else {
          this.renderer.removeClass(this.document.body, 'banner');
        }
      });

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

  async onResendVerificationEmail() {
    try {
      await lastValueFrom(this.api.requestVerificationEmail());
      this.alertService.success(
        $localize`:@@headerResendVerificationEmailSuccess:Verification email sent successfully.`
      );
    } catch (e) {
      console.error(e);
    }
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
