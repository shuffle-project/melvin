import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LivestreamComponent } from './livestream.component';

const routes: Routes = [{ path: '', component: LivestreamComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LivestreamRoutingModule { }
