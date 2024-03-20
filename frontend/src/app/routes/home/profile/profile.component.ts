import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HeaderComponent } from '../../../components/header/header.component';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import { ChangePasswordDto } from '../../../services/api/dto/auth.dto';
import * as authActions from '../../../store/actions/auth.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    HeaderComponent,
    LetDirective,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class ProfileComponent implements OnInit {
  user$!: Observable<AuthUser | null>;

  changePasswordSubmitted = false;
  changePasswordLoading$ = this.store.select(
    authSelectors.selectChangePasswordLoading
  );
  changePasswordError$ = this.store.select(
    authSelectors.selectChangePasswordError
  );
  changePasswordForm = this.formBuilder.group(
    {
      currentPassword: new FormControl<string | null>('', {
        validators: [Validators.required],
      }),
      newPassword: new FormControl<string | null>('', {
        validators: [Validators.required],
      }),
      confirmPassword: new FormControl<string | null>('', {
        validators: [Validators.required],
      }),
    },
    { validators: this.checkPasswords }
  );

  // language$ = this.store.select(configSelector.language);
  locale = $localize.locale;

  newNotifications$!: Observable<ReadonlyArray<Notification>>;
  oldNotifications$!: Observable<ReadonlyArray<Notification>>;

  constructor(
    private store: Store,
    private formBuilder: NonNullableFormBuilder
  ) {}

  onLanguageSwitched(event: MatSelectChange) {
    // TODO
    document.location.href = `${environment.frontendBaseUrl}/${event.value}/home/profile`;
  }

  ngOnInit() {
    this.user$ = this.store.select(authSelectors.selectUser);
  }

  getTime(timestamp: string) {
    return new Date(timestamp).getTime();
  }

  checkPasswords(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { notSame: true };
  }

  onSubmitChangePassword(email: string) {
    if (this.changePasswordForm.valid) {
      this.changePasswordSubmitted = true;
      const dto: ChangePasswordDto = {
        email,
        oldPassword: this.changePasswordForm.value.currentPassword!,
        newPassword: this.changePasswordForm.value.newPassword!,
      };
      this.store.dispatch(authActions.changePassword({ dto }));
    } else {
      // TODO maybe move code to its own change password dialog
    }
  }
}
