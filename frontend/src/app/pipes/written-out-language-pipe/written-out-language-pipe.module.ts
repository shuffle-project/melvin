import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WrittenOutLanguagePipe } from './written-out-language.pipe';

@NgModule({
  declarations: [WrittenOutLanguagePipe],
  imports: [CommonModule],
  exports: [WrittenOutLanguagePipe],
})
export class WrittenOutLanguageModulePipe {}
