import { NgClass } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  ActivitiesMap,
  ActivityEntity,
} from 'src/app/services/api/entities/activity.entity';
import { IconName } from '../../constants/icon.constants';
import { ProjectStatusPipe } from '../../pipes/project-status-pipe/project-status.pipe';
import { TimeDifferencePipe } from '../../pipes/time-difference-pipe/time-difference.pipe';
import { AvatarComponent } from '../avatar-group/avatar/avatar.component';

export type ActivityViewType = 'list' | 'popup' | 'timeline' | 'error-chip';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  imports: [
    NgClass,
    MatIconModule,
    RouterLink,
    AvatarComponent,
    TimeDifferencePipe,
  ],
})
export class ActivityComponent implements OnChanges {
  @Input() activity!: ActivityEntity;
  @Input() viewType: ActivityViewType = 'list';
  @Input() read: boolean = true;

  public icon: IconName = 'bell';
  public description!: SafeHtml;
  public level: 'info' | 'system' | 'warn' = 'info';

  constructor(
    private domSanitizer: DomSanitizer,
    private projectStatusPipe: ProjectStatusPipe
  ) {}

  ngOnChanges() {
    this.level = this.activity.createdBy.name === 'System' ? 'system' : 'info';

    switch (this.activity.action) {
      case 'video-processing-finished':
        this.icon = 'file_video';
        this.description = $localize`:@@activityVideoProcessingFinishedDescription:Video was processed successfully.`;
        break;
      case 'video-processing-failed':
        this.icon = 'warning';
        this.level = 'warn';
        this.description = $localize`:@@activityVideoProcessingFailedDescription:Video processing failed.`;
        break;
      case 'subtitles-processing-finished':
        this.icon = 'done';
        this.description = $localize`:@@activitySubtitlesProcessingFinishedDescription:Subtitles were created successfully.`;
        break;
      case 'subtitles-processing-failed':
        this.icon = 'warning';
        this.level = 'warn';
        this.description = $localize`:@@activitySubtitlesProcessingFailedDescription:Subtitle creation failed.`;
        break;
      case 'project-created':
        this.icon = 'party-popper';
        this.description = $localize`:@@activityProjectCreatedDescription:New project created.`;
        break;
      case 'project-status-updated': {
        const details = this.activity
          .details as ActivitiesMap['project-status-updated'];
        this.icon = 'bell';
        this.description = this.domSanitizer.bypassSecurityTrustHtml(
          $localize`:@@activityProjectStatusUpdatedDescription:Status changed to <span class="chip ${
            details.after
          }">${this.projectStatusPipe.transform(details.after)}</span>.`
        );
        break;
      }
      case 'project-title-updated': {
        const details = this.activity
          .details as ActivitiesMap['project-title-updated'];
        this.icon = 'bell';
        this.description = $localize`:@@activityProjectTitleUpdatedDescription:Titel changed from ${details.before}.`;
        break;
      }
      case 'project-user-joined': {
        const details = this.activity
          .details as ActivitiesMap['project-user-joined'];
        this.icon = 'person_add';
        this.description = $localize`:@@activityProjectUserJoinedDescription:${details.user.name} joined the project.`;
        break;
      }
      case 'project-user-left': {
        const details = this.activity
          .details as ActivitiesMap['project-user-left'];
        this.icon = 'person_remove';
        this.description = $localize`:@@activityProjectUserLeftDescription:${details.user.name} left the project.`;
        break;
      }
      default:
        this.icon = 'bell';
        break;
    }
  }
}
