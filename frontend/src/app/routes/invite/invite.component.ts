import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { AppState } from '../../store/app.state';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as authActions from './../../store/actions/auth.actions';
import { GuestLoginDialogComponent } from './components/guest-login/guest-login-dialog.component';

import { LetDirective } from '@ngrx/component';
@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
  imports: [
    LetDirective,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
})
export class InviteComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public isLoading$ = this.store.select(authSelectors.selectInviteLoading);
  public invite$ = this.store.select(authSelectors.selectInviteEntity);
  public user$ = this.store.select(authSelectors.selectUser);
  public error$ = this.store.select(authSelectors.selectInviteError);

  public currentUser$ = this.store.select(authSelectors.selectUser);
  public inviteToken$ = this.store.select(authSelectors.selectInviteTokenRoute);

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private dialog: MatDialog,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.store.dispatch(authActions.verifyInviteToken());
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onClickAbort() {
    this.router.navigate(['/home']);
  }

  async onClickJoin() {
    const token = await firstValueFrom(this.inviteToken$);

    const res = await firstValueFrom(this.api.joinViaInviteToken(token!));

    this.router.navigate(['/home']);
  }

  onClickAuth() {
    this.router.navigate(['/']);
  }

  onClickJoinAsGuest() {
    const dialog = this.dialog.open(GuestLoginDialogComponent);

    const subscription = dialog.afterClosed().subscribe((data) => {
      if (data) {
        this.store.dispatch(authActions.guestLogin({ name: data.name }));
      }
      subscription.unsubscribe();
    });
  }
}
