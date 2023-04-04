import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InviteComponent } from './invite.component';

const routes: Routes = [
  {
    component: InviteComponent,
    path: '',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InviteRoutingModule {}
