import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../../../../../store/actions/auth.actions';
import * as authSelectors from '../../../../../../store/selectors/auth.selector';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
  selector: 'app-register-dialog',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    PushPipe,
    MatInputModule,
    MatProgressSpinner,
    RouterLink,
    LetDirective,
  ],
  templateUrl: './register-dialog.component.html',
  styleUrl: './register-dialog.component.scss',
})
export class RegisterDialogComponent implements OnInit, OnDestroy {
  public formGroup!: FormGroup;
  private destroy$$ = new Subject<void>();

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private dialogRefRegisterDialog: MatDialogRef<RegisterDialogComponent>,
    private dialog: MatDialog
  ) {}

  public error$ = this.store.select(authSelectors.selectRegisterError);
  public loading$ = this.store.select(authSelectors.selectRegisterLoading);

  error = '';

  ngOnInit() {
    this.formGroup = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        passwordConfirm: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: [this.confirmPasswordValidator] }
    );

    this.store
      .select(authSelectors.selectIsLoggedIn)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((loggedIn) => {
        if (loggedIn) this.dialogRefRegisterDialog.close();
      });

    this.error$.pipe(takeUntil(this.destroy$$)).subscribe((error) => {
      this.error = error || '';
    });
  }

  private confirmPasswordValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    return control.value.password === control.value.passwordConfirm
      ? null
      : { confirm: true };
  }

  onSubmit(): void {
    this.store.dispatch(authActions.clearRegisterError());

    if (this.formGroup.valid) {
      const { email, name, password } = this.formGroup.value;

      this.store.dispatch(
        authActions.register({
          email,
          password,
          name,
        })
      );
    }
  }

  onJumpToPrivacy() {
    this.dialogRefRegisterDialog.close();
  }

  onOpenLoginDialog() {
    this.dialogRefRegisterDialog.close();
    this.dialog.open(LoginDialogComponent, {
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  ngOnDestroy() {
    if (this.error) {
      this.store.dispatch(authActions.clearRegisterError());
    }

    this.destroy$$.next();
  }
}
