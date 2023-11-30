import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AlertComponent } from './alert.component';

@NgModule({
    imports: [CommonModule, AlertComponent],
    exports: [AlertComponent],
})
export class AlertModule {}
