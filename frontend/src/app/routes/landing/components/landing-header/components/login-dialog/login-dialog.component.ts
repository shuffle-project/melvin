import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { StorageKey } from 'src/app/services/storage/storage-key.enum';
import { StorageService } from 'src/app/services/storage/storage.service';
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../../../../../store/actions/auth.actions';
import * as authSelectors from '../../../../../../store/selectors/auth.selector';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    PushPipe,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
})
export class LoginDialogComponent implements OnInit {
  public formGroup!: FormGroup;
  public error$!: Observable<string | null>;
  public loading$!: Observable<boolean>;

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private storageService: StorageService,
    private dialogRefLoginDialog: MatDialogRef<LoginDialogComponent>,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loading$ = this.store.select(authSelectors.selectLoginLoading);
    this.error$ = this.store.select(authSelectors.selectLoginError);

    this.formGroup = this.fb.group({
      email: this.fb.control(
        this.storageService.getFromLocalStorage(StorageKey.LOGIN_EMAIL, ''),
        [Validators.required, Validators.email]
      ),
      password: this.fb.control('', Validators.required),
      persistent: this.fb.control(false),
    });
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      const { email, password, persistent } = this.formGroup.value;

      this.store.dispatch(authActions.login({ email, password, persistent }));
      // TODO SHOULD ONLY FIRE WHEN SUCCESS
      this.dialogRefLoginDialog.close();
    }
  }

  onOpenRegisterDialog() {
    this.dialogRefLoginDialog.close();
    this.dialog.open(RegisterDialogComponent, {
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }

  onOpenResetPasswordDialog() {
    this.dialogRefLoginDialog.close();
    this.dialog.open(ResetPasswordDialogComponent, {
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }
}