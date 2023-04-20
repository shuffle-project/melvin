import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { AuthUser } from '../../interfaces/auth.interfaces';
import { ApiService } from '../../services/api/api.service';
import { InviteEntity } from '../../services/api/entities/auth.entity';
import { AppState } from '../../store/app.state';
import * as authSelectors from '../../store/selectors/auth.selector';
import * as authActions from './../../store/actions/auth.actions';
import { GuestLoginDialogComponent } from './components/guest-login/guest-login-dialog.component';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public isLoading$!: Observable<boolean>;
  public user$!: Observable<AuthUser | null>;
  public invite$!: Observable<InviteEntity | null>;
  public error$!: Observable<string | null>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private dialog: MatDialog,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.store.select(authSelectors.selectInviteLoading);
    this.invite$ = this.store.select(authSelectors.selectInviteEntity);
    this.user$ = this.store.select(authSelectors.selectUser);
    this.error$ = this.store.select(authSelectors.selectInviteError);

    this.store.dispatch(authActions.verifyInviteToken());

    // // this.store
    // //   .select(authSelectors.getInviteToken)
    // //   .pipe(
    // //     takeUntil(this.destroy$$),
    // //     exhaustMap((token) =>
    // //       this.api.verifyInviteToken(token).pipe(
    // //         map((project) => project),
    // //         catchError((err: HttpErrorResponse) => of(err.message))
    // //       )
    // //     )
    // //   )
    // //   .subscribe((project) => {
    // //     if (project) {
    // //       console.log(project);
    // //     } else {
    // //       this.router.navigate(['/']);
    // //     }
    // //   });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  // private async verifyToken(token: string): Promise<void> {
  //   try {
  //     const res = await this.api.verifyInviteToken(token);
  //   } catch (err) {
  //   } finally {
  //     this.loading = false;
  //   }
  // }

  onClickAbort() {
    this.router.navigate(['/home']);
  }

  onClickJoin() {
    console.log('join');
  }

  onClickAuth() {
    this.router.navigate(['/auth']);
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
