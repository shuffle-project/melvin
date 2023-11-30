import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ProjectStatusPipeModule } from '../../../../pipes/project-status-pipe/project-status-pipe.module';
import { SharedModule } from '../../../shared/shared.module';
import { ProjectGeneralComponent } from './project-general.component';

@NgModule({
    imports: [CommonModule, SharedModule, ProjectStatusPipeModule, ProjectGeneralComponent],
    exports: [ProjectGeneralComponent],
})
export class ProjectGeneralModule {}
