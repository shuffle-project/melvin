import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { ProjectStatusPipeModule } from 'src/app/pipes/project-status-pipe/project-status-pipe.module';
import { TimeDifferencePipeModule } from 'src/app/pipes/time-difference-pipe/time-difference-pipe.module';
import { AvatarModule } from '../avatar-group/avatar/avatar.module';
import { ActivityComponent } from './activity.component';

@NgModule({
  declarations: [ActivityComponent],
  imports: [
    CommonModule,
    SharedModule,
    TimeDifferencePipeModule,
    ProjectStatusPipeModule,
    RouterModule,
    AvatarModule,
  ],
  exports: [ActivityComponent],
})
export class ActivityModule {}
