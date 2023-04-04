import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { HeaderModule } from 'src/app/components/header/header.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    HeaderModule,
    SharedModule,
    MatListModule,
  ],
})
export class ProfileModule {}
