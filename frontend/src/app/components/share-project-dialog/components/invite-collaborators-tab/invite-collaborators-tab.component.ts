import { Clipboard } from '@angular/cdk/clipboard';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  iif,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { AvatarComponent } from 'src/app/components/avatar-group/avatar/avatar.component';
import { AuthUser } from 'src/app/interfaces/auth.interfaces';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
// import * as projectsActions from '../../../../store/actions/projects.actions';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';
import * as authSelectors from '../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../store/selectors/editor.selector';
import * as projectSelectors from '../../../../store/selectors/projects.selector';

@Component({
  selector: 'app-invite-collaborators-tab',
  imports: [
    MatFormFieldModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    AvatarComponent,
    PushPipe,
    MatIconModule,
  ],
  templateUrl: './invite-collaborators-tab.component.html',
  styleUrl: './invite-collaborators-tab.component.scss',
})
export class InviteCollaboratorsTabComponent implements OnInit, OnDestroy {
  public error!: string | null;
  public inviteToken!: string;
  private destroy$$ = new Subject<void>();

  authUser$!: Observable<AuthUser | null>;
  project!: ProjectEntity;

  @Input({ required: true }) projectId!: string;

  @ViewChild('addMemberForm') addMemberForm!: NgForm;

  // Not the displayed users, but the input of the user, who interacts with the dialog
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;

  @ViewChild('inviteResult') inviteResult!: ElementRef<HTMLElement>;

  autoCompleteUsers: readonly UserEntity[] = [];
  userControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private clipboard: Clipboard,
    private store: Store,
    private router: Router,
    private configService: ConfigService
  ) {
    this.authUser$ = this.store.select(authSelectors.selectUser);
  }

  inviteLink(): string {
    return `${this.configService.getFrontendBaseUrl()}/invite/${
      this.inviteToken
    }`;
  }

  async ngOnInit(): Promise<void> {
    this.error = null;

    if (this.router.url.includes('/editor/')) {
      this.store
        .select(editorSelectors.selectProject)
        .pipe(takeUntil(this.destroy$$))
        .subscribe((project) => {
          if (project) this.project = project;
        });
    } else {
      this.store
        .select(projectSelectors.selectAllProjects)
        .pipe(takeUntil(this.destroy$$))
        .subscribe((projects) => {
          const project = projects.find((p) => p.id === this.projectId)!;
          this.project = project;
        });
    }

    try {
      this.inviteToken = await lastValueFrom(
        this.apiService
          .getProjectInviteToken(this.projectId)
          .pipe(map((o) => o.inviteToken))
      );
    } catch (err: unknown) {
      this.error = (err as HttpErrorResponse).message;
    }

    this.userControl.valueChanges
      .pipe(
        takeUntil(this.destroy$$),
        debounceTime(600),
        map((value) => {
          return value.trim();
        }),
        distinctUntilChanged(),
        switchMap((search) =>
          iif(
            () => search.length !== 0,
            this.apiService.findAllUsers(search),
            of([] as UserEntity[])
          )
        )
      )
      .subscribe((users) => {
        this.autoCompleteUsers = users;
      });
  }

  async inviteMember() {
    this.project.users.forEach((user) => {
      if (user.email === this.userControl.value) {
        this.userControl.setErrors({ duplication: true });
      }
    });

    if (!this.userControl.valid) {
      this.userControl.markAsDirty();
      this.userControl.markAllAsTouched();
    } else {
      // TODO: handle error
      const res = await lastValueFrom(
        this.apiService.invite(this.projectId, [this.userControl.value])
      );

      this.alertService.success(this.userControl.value + ' invited.');
      this.inviteResult.nativeElement.innerText =
        this.userControl.value + ' invited.';

      this.userControl.reset();
      this.userControl.setErrors([]);
      // this.userControl.markAsUntouched();
      // this.userControl.updateValueAndValidity();
    }
  }

  onAddMemberThroughSelect(event: MatAutocompleteSelectedEvent) {
    this.userControl.setValue(event.option.value.email);
  }

  async onClickUpdateInvite() {
    try {
      this.inviteToken = await lastValueFrom(
        this.apiService
          .updateProjectInviteToken(this.projectId)
          .pipe(map((o) => o.inviteToken))
      );
      this.alertService.success(
        $localize`:@@inviteCollaboratorNewLinkSuccess:New link generated`
      );
    } catch (err: unknown) {
      //TODO handle error
      console.error(err);
    }
  }

  async ngOnDestroy(): Promise<void> {
    this.destroy$$.next();
  }

  onClickCopyLink() {
    this.clipboard.copy(this.inviteLink());
    this.alertService.success(
      $localize`:@@inviteCollaboratorCopyLinkSuccess:Link copied`
    );
  }

  async removeUserFromProject(user: UserEntity) {
    try {
      await lastValueFrom(
        this.apiService.removeUserFromProject(this.projectId, user.id)
      );
    } catch (err: unknown) {
      // TODO handle error
      this.error = (err as HttpErrorResponse).message;
    }
  }
}
