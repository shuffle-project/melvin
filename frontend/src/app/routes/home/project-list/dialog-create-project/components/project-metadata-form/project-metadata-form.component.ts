import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  debounceTime,
  distinctUntilChanged,
  iif,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  MemberEntry,
  MemberEntryType,
} from 'src/app/constants/member.constants';
import { ApiService } from '../../../../../../../app/services/api/api.service';
import { UserEntity } from '../../../../../../../app/services/api/entities/user.entity';
import { MetadataGroup } from '../../dialog-create-project.interfaces';

@Component({
  selector: 'app-project-metadata-form',
  styleUrls: ['./project-metadata-form.component.scss'],
  templateUrl: './project-metadata-form.component.html',
})
export class ProjectMetadataFormComponent implements OnInit, OnDestroy {
  @Input() metadataGroup!: FormGroup<MetadataGroup>;

  private destroy$$ = new Subject<void>();

  users: readonly UserEntity[] = [];
  userControl = new FormControl();

  // Not the displayed users, but the input of the user, who interacts with the dialog
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;

  // When the user inputs an enter or comma, a chip will be created
  separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private api: ApiService) {}

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      if (control.hasError('invalidEntry')) return true;
      return false;
    },
  };

  ngOnInit() {
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
          this.users = users;
        } else {
          this.users = [];
        }
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  filter(name: String): UserEntity[] {
    const filterValue = name.toLowerCase();
    return this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(filterValue) ||
        user.email.toLowerCase().includes(filterValue)
    );
  }

  addMember(newMemberEntry: MemberEntry) {
    let newMemberEntryEmail = this.getEmail(newMemberEntry);
    let alreadyIncluded = this.metadataGroup.value.members?.filter(
      (member: MemberEntry) => {
        let memberEmail = this.getEmail(member);
        return memberEmail === newMemberEntryEmail;
      }
    );

    if (alreadyIncluded?.length === 0) {
      this.metadataGroup.controls.members.setValue([
        ...this.metadataGroup.controls.members.value,
        newMemberEntry,
      ]);
      this.metadataGroup.controls.members.updateValueAndValidity();
    }

    this.userInput.nativeElement.value = '';
    this.userControl.setValue('');
  }

  onAddMemberThroughInput(event: MatChipInputEvent) {
    let newMemberEntry: string = event.value.toLowerCase();
    if (newMemberEntry === '') return;

    let memberMatchesAutoComplete = this.users.find(
      (user) =>
        user.email.toLowerCase().includes(newMemberEntry) ||
        user.name.toLowerCase().includes(newMemberEntry)
    );

    let validEmail =
      /^(([^+<>()[\]\.,;:\s@\"]+(\.[^+<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^+<>()[\]\.,;:\s@\"]+\.)+[^+<>()[\]\.,;:\s@\"]{2,})$/i.test(
        newMemberEntry
      );

    if (memberMatchesAutoComplete) {
      this.addMember({
        type: MemberEntryType.USER,
        user: memberMatchesAutoComplete,
      });
    } else if (validEmail) {
      this.addMember({
        type: MemberEntryType.VALID_EMAIL,
        unknownEmail: newMemberEntry,
      });
    } else {
      this.addMember({
        type: MemberEntryType.INVALID_EMAIL,
        unknownEmail: newMemberEntry,
      });
    }
  }

  onAddMemberThroughSelect(event: MatAutocompleteSelectedEvent) {
    this.addMember({
      type: MemberEntryType.USER,
      user: event.option.value,
    });
  }

  getEmail(memberEntry: MemberEntry) {
    return memberEntry.type === MemberEntryType.USER
      ? memberEntry.user?.email
      : memberEntry.unknownEmail;
  }

  onRemoveMember(removeMemberEntry: MemberEntry) {
    let removeMemberEntryEmail = this.getEmail(removeMemberEntry);
    let filteredMembers = this.metadataGroup.controls.members.value.filter(
      (member: MemberEntry) => {
        let memberEmail = this.getEmail(member);
        return memberEmail !== removeMemberEntryEmail;
      }
    );
    this.metadataGroup.controls.members.setValue(filteredMembers);
  }

  onDisplayMember(memberEntry: MemberEntry) {
    return memberEntry.type === MemberEntryType.USER
      ? memberEntry.user?.name
      : memberEntry.unknownEmail;
  }

  onClearTitleField() {
    this.metadataGroup.controls.title.reset();
  }
}
