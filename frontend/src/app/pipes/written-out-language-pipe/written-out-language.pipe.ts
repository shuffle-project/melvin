import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'writtenOutLanguage',
  standalone: true,
})
export class WrittenOutLanguagePipe implements PipeTransform {
  transform(languageCode: string, title: string = '') {
    let localizeLanguage = '';
    switch (languageCode) {
      case 'de-DE':
      case 'de':
        localizeLanguage = $localize`:@@writtenLanguageDE-DE:German`;
        break;
      case 'en':
        localizeLanguage = $localize`:@@writtenLanguageEN:English`;
        break;
      case 'en-GB':
        localizeLanguage = $localize`:@@writtenLanguageEN-GB:English (GB)`;
        break;
      case 'en-US':
        localizeLanguage = $localize`:@@writtenLanguageEN-US:English (US)`;
        break;
      case 'es-ES':
      case 'es':
        localizeLanguage = $localize`:@@writtenLanguageES-ES:Spanish`;
        break;
      case 'fr-FR':
      case 'fr':
        localizeLanguage = $localize`:@@writtenLanguageFR-FR:French`;
        break;
      default:
        localizeLanguage = languageCode;
    }

    if (title) {
      return `${localizeLanguage} [${title}]`;
    } else {
      return `${localizeLanguage}`;
    }
  }
}
