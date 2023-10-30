import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, NgForm, Validators } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
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
import { environment } from '../../../environments/environment';
import { MemberEntry, MemberEntryType } from '../../constants/member.constants';
import { SharedModule } from '../../modules/shared/shared.module';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import { UserEntity } from '../../services/api/entities/user.entity';
import { AppState } from '../../store/app.state';
import { AlertModule } from '../alert/alert.module';
import { AvatarModule } from '../avatar-group/avatar/avatar.module';

interface DialogData {
  project: ProjectEntity;
}

@Component({
  selector: 'app-share-project-dialog',
  templateUrl: './share-project-dialog.component.html',
  styleUrls: ['./share-project-dialog.component.scss'],
  imports: [
    CommonModule,
    SharedModule,
    AvatarModule,
    ClipboardModule,
    AlertModule,
    MatChipsModule,
    MatAutocompleteModule,
  ],
  standalone: true,
})
export class ShareProjectDialogComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public project: ProjectEntity;
  public inviteToken!: string;
  public isLoading!: boolean;
  public error!: string | null;

  @ViewChild('inviteResult') inviteResult!: ElementRef<HTMLElement>;

  @ViewChild('addMemberForm') addMemberForm!: NgForm;

  // Not the displayed users, but the input of the user, who interacts with the dialog
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;

  users: readonly UserEntity[] = [];
  userControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  separatorKeysCodes: number[] = [ENTER, COMMA];

  // members: this.fb.control<MemberEntry[]>([], {
  //   validators: [this.memberEntriesValidator()],
  // }),

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DialogData,
    private apiService: ApiService,
    private clipboard: Clipboard,
    private alertService: AlertService,
    private api: ApiService,
    private store: Store<AppState>
  ) {
    this.project = data.project;
  }

  get inviteLink(): string {
    return `${environment.frontendBaseUrl}/invite/${this.inviteToken}`;
  }

  async ngOnDestroy(): Promise<void> {
    this.destroy$$.next();
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
          return value.trimLeft().trim();
        }),
        distinctUntilChanged(),
        switchMap((search) =>
          iif(
            () => search.length !== 0,
            this.api.findAllUsers(search),
            of(search) // this Observable is completely unnecessary
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
    console.log('invite');
    if (this.userControl.valid) {
      // const newUser = this.users.find(
      //   (item) => item.email === this.userControl.value
      // );

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
    // this.addMember({
    //   type: MemberEntryType.USER,
    //   user: event.option.value,
    // });
  }

  onClickCopyLink() {
    this.clipboard.copy(this.inviteLink);
    this.alertService.success(
      $localize`:@@shareProjectLinkCopiedMessage:Link copied`
    );
  }

  async onClickUpdate() {
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
}
