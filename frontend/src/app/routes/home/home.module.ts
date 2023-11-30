import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LogoModule } from '../../components/logo/logo.module';
import { SharedModule } from '../../modules/shared/shared.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';

@NgModule({
    imports: [CommonModule, HomeRoutingModule, SharedModule, LogoModule, HomeComponent],
})
export class HomeModule {}
