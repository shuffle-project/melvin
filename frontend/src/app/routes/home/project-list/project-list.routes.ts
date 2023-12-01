import { Routes } from '@angular/router';
import { ProjectListComponent } from './project-list.component';

export const ProjectListRoutes: Routes = [
  { path: '', component: ProjectListComponent },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class ProjectListRoutingModule {}
