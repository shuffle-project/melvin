import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { FooterComponent } from './footer.component';

@NgModule({
    imports: [CommonModule, SharedModule, RouterModule, FooterComponent],
    exports: [FooterComponent],
})
export class FooterModule {}
