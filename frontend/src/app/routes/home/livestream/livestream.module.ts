import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LivestreamRoutingModule } from './livestream-routing.module';
import { LivestreamComponent } from './livestream.component';


@NgModule({
    imports: [
        CommonModule,
        LivestreamRoutingModule,
        LivestreamComponent
    ]
})
export class LivestreamModule { }
