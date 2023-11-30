import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WrittenOutLanguagePipe } from './written-out-language.pipe';

@NgModule({
    imports: [CommonModule, WrittenOutLanguagePipe],
    exports: [WrittenOutLanguagePipe],
})
export class WrittenOutLanguageModulePipe {}
