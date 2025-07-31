import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../../../../../store/actions/auth.actions';

@Component({
  selector: 'app-register-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './register-dialog.component.html',
  styleUrl: './register-dialog.component.scss',
})
export class RegisterDialogComponent implements OnInit, OnDestroy {
  // public formGroup!: FormGroup;
  private destroy$$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private dialogRefRegisterDialog: MatDialogRef<RegisterDialogComponent>,
    private dialog: MatDialog
  ) {} // private fb: NonNullableFormBuilder,

  // public error$ = this.store.select(authSelectors.selectRegisterError);
  // public loading$ = this.store.select(authSelectors.selectRegisterLoading);

  error = '';

  ngOnInit() {
    // this.formGroup = this.fb.group(
    //   {
    //     email: ['', [Validators.required, Validators.email]],
    //     name: ['', [Validators.required]],
    //     password: ['', [Validators.required, Validators.minLength(6)]],
    //     passwordConfirm: ['', [Validators.required, Validators.minLength(6)]],
    //   },
    //   { validators: [this.confirmPasswordValidator] }
    // );
    // this.store
    //   .select(authSelectors.selectIsLoggedIn)
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe((loggedIn) => {
    //     if (loggedIn) this.dialogRefRegisterDialog.close();
    //   });
    // this.error$.pipe(takeUntil(this.destroy$$)).subscribe((error) => {
    //   this.error = error || '';
    // });
  }

  // private confirmPasswordValidator(
  //   control: AbstractControl
  // ): ValidationErrors | null {
  //   return control.value.password === control.value.passwordConfirm
  //     ? null
  //     : { confirm: true };
  // }

  onSubmit(): void {
    // this.store.dispatch(authActions.clearRegisterError());
    // if (this.formGroup.valid) {
    //   const { email, name, password } = this.formGroup.value;
    //   this.store.dispatch(
    //     authActions.register({
    //       email,
    //       password,
    //       name,
    //     })
    //   );
    // }
  }

  onJumpToPrivacy() {
    // this.dialogRefRegisterDialog.close();
  }

  ngOnDestroy() {
    if (this.error) {
      this.store.dispatch(authActions.clearRegisterError());
    }
    this.destroy$$.next();
  }
}
