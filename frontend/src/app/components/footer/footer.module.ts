import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { LogoModule } from '../logo/logo.module';
import { FooterComponent } from './footer.component';

@NgModule({
    imports: [CommonModule, SharedModule, LogoModule, RouterModule, FooterComponent],
    exports: [FooterComponent],
})
export class FooterModule {}
