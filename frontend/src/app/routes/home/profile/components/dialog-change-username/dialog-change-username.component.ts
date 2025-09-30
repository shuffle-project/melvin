import { Component, OnDestroy } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthUser } from 'src/app/interfaces/auth.interfaces';
import { ApiService } from 'src/app/services/api/api.service';
import { UpdateUserDto } from 'src/app/services/api/dto/update-user.dto';
import { AppState } from 'src/app/store/app.state';
import * as authSelectors from '../../../../../store/selectors/auth.selector';

@Component({
  selector: 'app-dialog-change-username',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    PushPipe,
  ],
  templateUrl: './dialog-change-username.component.html',
  styleUrl: './dialog-change-username.component.scss',
})
export class DialogChangeUsernameComponent implements OnDestroy {
  private destroy$$ = new Subject<void>();

  changeUsernameForm = this.formBuilder.group({
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private store: Store<AppState>,
    private formBuilder: NonNullableFormBuilder,
    private api: ApiService
  ) {
    this.store
      .select(authSelectors.selectUser)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((user: AuthUser | null) => {
        if (user?.name) {
          this.changeUsernameForm.patchValue({ username: user.name });
        }
      });
  }

  async onSubmitChangeUsername() {
    if (this.changeUsernameForm.invalid) {
      this.changeUsernameForm.markAllAsTouched();
      return;
    }

    const dto: UpdateUserDto = {
      name: this.changeUsernameForm.value.username!,
    };

    // TODO
    const updateUser = await firstValueFrom(this.api.updateUser(dto));
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
