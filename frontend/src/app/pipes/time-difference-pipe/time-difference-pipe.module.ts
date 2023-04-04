import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimeDifferencePipe } from './time-difference.pipe';

@NgModule({
  declarations: [TimeDifferencePipe],
  imports: [CommonModule],
  exports: [TimeDifferencePipe],
})
export class TimeDifferencePipeModule {}
