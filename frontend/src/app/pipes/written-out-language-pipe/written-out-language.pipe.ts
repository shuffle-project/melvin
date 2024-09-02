import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from 'src/app/services/language/language.service';

@Pipe({
  name: 'writtenOutLanguage',
  standalone: true,
})
export class WrittenOutLanguagePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}

  transform(languageCode: string, title: string = '') {
    const localizedLanguage =
      this.languageService.getLocalizedLanguage(languageCode);

    if (title) {
      return `${localizedLanguage} [${title}]`;
    } else {
      return `${localizedLanguage}`;
    }
  }
}
