import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormatDatePipe } from './format-date.pipe';

@NgModule({
    imports: [CommonModule, FormatDatePipe],
    exports: [FormatDatePipe],
})
export class FormatDatePipeModule {}
