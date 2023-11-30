import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { AvatarGroupModule } from 'src/app/components/avatar-group/avatar-group.module';
import { FooterModule } from 'src/app/components/footer/footer.module';
import { HeaderModule } from 'src/app/components/header/header.module';
import { LogoModule } from '../../../components/logo/logo.module';
import { ProjectDetailModule } from '../../../modules/project-detail/project-detail.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { DurationPipeModule } from '../../../pipes/duration-pipe/duration-pipe.module';
import { FormatDatePipeModule } from '../../../pipes/format-date-pipe/format-date-pipe.module';
import { DialogCreateProjectModule } from './dialog-create-project/dialog-create-project.module';
import { ProjectListRoutingModule } from './project-list-routing.module';
import { ProjectListComponent } from './project-list.component';
@NgModule({
    imports: [
        CommonModule,
        ProjectListRoutingModule,
        SharedModule,
        DurationPipeModule,
        FormatDatePipeModule,
        LogoModule,
        HeaderModule,
        MatExpansionModule,
        MatChipsModule,
        AvatarGroupModule,
        DialogCreateProjectModule,
        FooterModule,
        ProjectDetailModule,
        ProjectListComponent,
    ],
})
export class ProjectListModule {}
