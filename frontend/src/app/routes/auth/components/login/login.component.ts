import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { StorageKey } from '../../../../services/storage/storage-key.enum';
import { StorageService } from '../../../../services/storage/storage.service';
import * as authActions from '../../../../store/actions/auth.actions';
import { AppState } from '../../../../store/app.state';
import * as authSelectors from '../../../../store/selectors/auth.selector';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe,
  ],
})
export class LoginComponent implements OnInit {
  public formGroup!: FormGroup;
  public error$!: Observable<string | null>;
  public loading$!: Observable<boolean>;

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private storageService: StorageService
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
    }
  }
}
