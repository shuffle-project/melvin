import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { ProjectStatusPipeModule } from 'src/app/pipes/project-status-pipe/project-status-pipe.module';


import { ActivityComponent } from './activity.component';

@NgModule({
    imports: [
    CommonModule,
    SharedModule,
    ProjectStatusPipeModule,
    RouterModule,
    ActivityComponent,
],
    exports: [ActivityComponent],
})
export class ActivityModule {}
