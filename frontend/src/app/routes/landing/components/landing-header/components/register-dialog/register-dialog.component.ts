import { Component } from '@angular/core';
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
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../../../../../store/actions/auth.actions';
import * as authSelectors from '../../../../../../store/selectors/auth.selector';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
  selector: 'app-register-dialog',
  standalone: true,
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
export class RegisterDialogComponent {
  public formGroup!: FormGroup;

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private dialogRefRegisterDialog: MatDialogRef<RegisterDialogComponent>,
    private dialog: MatDialog
  ) {}

  public error$ = this.store.select(authSelectors.selectRegisterError);
  public loading$ = this.store.select(authSelectors.selectRegisterLoading);
  public success$ = this.store.select(authSelectors.selectRegisterSuccess);

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

    this.loading$.subscribe((ev) => console.log(ev));
    this.error$.subscribe((ev) => console.log(ev));
    this.success$.subscribe((ev) => console.log(ev));
  }

  private confirmPasswordValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    return control.value.password === control.value.passwordConfirm
      ? null
      : { confirm: true };
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      const { email, name, password } = this.formGroup.value;

      this.store.dispatch(
        authActions.register({
          email,
          password,
          name,
        })
      );

      // TODO SHOULD ONLY FIRE WHEN SUCCESS
      this.dialogRefRegisterDialog.close();
    }
  }

  onJumpToPrivacy() {
    this.dialogRefRegisterDialog.close();
  }

  onOpenLoginDialog() {
    this.dialogRefRegisterDialog.close();
    this.dialog.open(LoginDialogComponent, {
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }
}
