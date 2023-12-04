import { Routes } from '@angular/router';
import { LivestreamComponent } from './livestream.component';

export const LivestreamRoutes: Routes = [
  { path: '', component: LivestreamComponent },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule]
// })
// export class LivestreamRoutingModule { }
