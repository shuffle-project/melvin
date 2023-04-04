import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActivityModule } from '../../../../components/activity/activity.module';
import { ProjectActivityComponent } from './project-activity.component';

@NgModule({
  declarations: [ProjectActivityComponent],
  imports: [CommonModule, ActivityModule],
  exports: [ProjectActivityComponent],
})
export class ProjectActivityModule {}
