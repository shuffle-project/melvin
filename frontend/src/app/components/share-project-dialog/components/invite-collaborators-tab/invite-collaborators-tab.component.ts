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
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
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
import {
  MemberEntry,
  MemberEntryType,
} from 'src/app/constants/member.constants';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-invite-collaborators-tab',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './invite-collaborators-tab.component.html',
  styleUrl: './invite-collaborators-tab.component.scss',
})
export class InviteCollaboratorsTabComponent implements OnInit, OnDestroy {
  public isLoading!: boolean;
  public error!: string | null;
  public inviteToken!: string;
  private destroy$$ = new Subject<void>();

  @Input({ required: true }) project!: ProjectEntity;

  @ViewChild('addMemberForm') addMemberForm!: NgForm;

  // Not the displayed users, but the input of the user, who interacts with the dialog
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;

  @ViewChild('inviteResult') inviteResult!: ElementRef<HTMLElement>;

  users: readonly UserEntity[] = [];
  userControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private api: ApiService,
    private clipboard: Clipboard
  ) {}

  get inviteLink(): string {
    return `${environment.frontendBaseUrl}/invite/${this.inviteToken}`;
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      this.inviteToken = await lastValueFrom(
        this.apiService
          .getProjectInviteToken(this.project.id)
          .pipe(map((o) => o.inviteToken))
      );
    } catch (err: unknown) {
      this.error = (err as HttpErrorResponse).message;
    } finally {
      this.isLoading = false;
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
            this.api.findAllUsers(search),
            of(search)
            // this Observable is completely unnecessary
            // the docs say that it shoud work without, but it doesn't
            // https://www.learnrxjs.io/learn-rxjs/operators/conditional/iif
          )
        )
      )
      .subscribe((users) => {
        if (users) {
          this.users = users as UserEntity[];
        } else {
          this.users = [];
        }
      });
  }

  async inviteMember() {
    if (!this.userControl.valid) {
      this.userControl.markAsDirty();
      this.userControl.markAllAsTouched();
    } else {
      const res = await lastValueFrom(
        this.api.invite(this.project.id, [this.userControl.value])
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
          .updateProjectInviteToken(this.project.id)
          .pipe(map((o) => o.inviteToken))
      );
    } catch (err: unknown) {
      console.error(err);
    }
  }

  onDisplayMember(memberEntry: MemberEntry) {
    return memberEntry.type === MemberEntryType.USER
      ? memberEntry.user?.name
      : memberEntry.unknownEmail;
  }

  getEmail(memberEntry: MemberEntry) {
    return memberEntry.type === MemberEntryType.USER
      ? memberEntry.user?.email
      : memberEntry.unknownEmail;
  }

  async ngOnDestroy(): Promise<void> {
    this.destroy$$.next();
  }

  onClickCopyLink(link: string) {
    this.clipboard.copy(link);
    this.alertService.success(
      $localize`:@@shareProjectLinkCopiedMessage:Link copied`
    );
  }
}
