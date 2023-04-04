import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LanguageCodePipe } from './language-code.pipe';

@NgModule({
  declarations: [LanguageCodePipe],
  imports: [CommonModule],
  exports: [LanguageCodePipe],
})
export class LanugageCodePipeModule {}
