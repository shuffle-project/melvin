import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as authSelectors from '../../../../../../store/selectors/auth.selector';
import { LoginComponent } from './login/login.component';

@Component({
  selector: 'app-login-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, LoginComponent],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
})
export class LoginDialogComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private dialogRefLoginDialog: MatDialogRef<LoginDialogComponent>
  ) {}

  ngOnInit() {
    this.store
      .select(authSelectors.selectIsLoggedIn)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((loggedIn) => {
        if (loggedIn) this.dialogRefLoginDialog.close();
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
