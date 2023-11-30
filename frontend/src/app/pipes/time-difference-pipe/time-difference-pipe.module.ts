import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimeDifferencePipe } from './time-difference.pipe';

@NgModule({
    imports: [CommonModule, TimeDifferencePipe],
    exports: [TimeDifferencePipe],
})
export class TimeDifferencePipeModule {}
