import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { merge, Subject, takeUntil } from 'rxjs';
import {
  MemberEntry,
  MemberEntryType,
} from 'src/app/constants/member.constants';
import {
  AsrServiceConfig,
  Language,
} from 'src/app/services/api/entities/config.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../../store/selectors/config.selector';
import {
  LiveGroup,
  MetadataGroup,
  VideoGroup,
} from '../../dialog-create-project.interfaces';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';


@Component({
    selector: 'app-project-overview-form',
    templateUrl: './project-overview-form.component.html',
    styleUrls: ['./project-overview-form.component.scss'],
    standalone: true,
    imports: [
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatIconModule
],
})
export class ProjectOverviewFormComponent implements OnInit, AfterViewInit {
  @Input() metadataGroup!: FormGroup<MetadataGroup>;
  @Input() videoGroup!: FormGroup<VideoGroup>;
  @Input() liveGroup!: FormGroup<LiveGroup>;

  private asrServices$ = this.store.select(configSelector.asrServiceConfig);
  private asrServices!: AsrServiceConfig[];
  private destroy$$ = new Subject<void>();
  private languages$ = this.store.select(configSelector.languagesConfig);
  private languages!: Language[];

  public asrVendor = '';
  public asrLanguage = '';

  public livestreamLanguage = '';

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    this.asrServices$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((asrServices) => {
        this.asrServices = asrServices;
      });

    this.languages$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((languages) => (this.languages = languages));
  }

  ngAfterViewInit(): void {
    this.liveGroup.controls.settings.controls.language.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((valueChange) => {
        const language = this.languages.find((o) => o.code === valueChange);
        if (language) this.livestreamLanguage = language.name;
      });

    merge(
      this.videoGroup.controls.asrGroup.valueChanges,
      this.liveGroup.controls.asrGroup.valueChanges
    )
      .pipe(takeUntil(this.destroy$$))
      .subscribe((valueChange) => {
        if ('asrVendor' in valueChange && valueChange.asrVendor !== '') {
          const selectedVendor = this.asrServices.find(
            (o) => o.asrVendor === valueChange.asrVendor
          );
          if (selectedVendor) this.asrVendor = selectedVendor.fullName;

          if ('language' in valueChange && valueChange.language !== '') {
            const selectedLanguage = selectedVendor?.languages.find(
              (o) => o.code === valueChange.language
            );
            if (selectedLanguage) this.asrLanguage = selectedLanguage.name;
          }
        }
      });
  }

  onDisplayMember(memberEntry: MemberEntry) {
    return memberEntry.type === MemberEntryType.USER
      ? memberEntry.user?.name
      : memberEntry.unknownEmail;
  }
}
