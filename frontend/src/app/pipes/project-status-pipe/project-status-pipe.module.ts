import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProjectStatusPipe } from './project-status.pipe';

@NgModule({
  declarations: [ProjectStatusPipe],
  imports: [CommonModule],
  exports: [ProjectStatusPipe],
  providers: [ProjectStatusPipe],
})
export class ProjectStatusPipeModule {}
