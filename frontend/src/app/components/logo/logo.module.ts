import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from './logo.component';



@NgModule({
    imports: [
        CommonModule,
        LogoComponent
    ],
    exports: [
        LogoComponent
    ]
})
export class LogoModule { }
