import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

import { SharedModule } from '../../../modules/shared/shared.module';

import { ProjectListRoutingModule } from './project-list-routing.module';
import { ProjectListComponent } from './project-list.component';
@NgModule({
  imports: [
    CommonModule,
    ProjectListRoutingModule,
    SharedModule,
    MatExpansionModule,
    MatChipsModule,
    ProjectListComponent,
  ],
})
export class ProjectListModule {}
