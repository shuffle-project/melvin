import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import * as authActions from '../../../../store/actions/auth.actions';
import { AppState } from '../../../../store/app.state';
import * as authSelectors from '../../../../store/selectors/auth.selector';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
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
