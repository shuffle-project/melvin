import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LanguageCodePipe } from './language-code.pipe';

@NgModule({
    imports: [CommonModule, LanguageCodePipe],
    exports: [LanguageCodePipe],
})
export class LanugageCodePipeModule {}
