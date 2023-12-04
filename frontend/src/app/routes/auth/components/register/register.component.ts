import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, NonNullableFormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as authActions from '../../../../store/actions/auth.actions';
import { AppState } from '../../../../store/app.state';
import * as authSelectors from '../../../../store/selectors/auth.selector';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: true,
    imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LetDirective,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe
],
})
export class RegisterComponent implements OnInit {
  public formGroup!: FormGroup;

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>
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
