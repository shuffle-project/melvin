import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DurationPipe } from './duration.pipe';

@NgModule({
    imports: [CommonModule, DurationPipe],
    exports: [DurationPipe],
})
export class DurationPipeModule {}
