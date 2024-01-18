import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'writtenOutLanguage',
  standalone: true,
})
export class WrittenOutLanguagePipe implements PipeTransform {
  transform(languageCode: string) {
    switch (languageCode) {
      case 'de-DE':
      case 'de':
        return $localize`:@@writtenLanguageDE-DE:German`;
      case 'en':
        return $localize`:@@writtenLanguageEN:English`;
      case 'en-GB':
        return $localize`:@@writtenLanguageEN-GB:English (GB)`;
      case 'en-US':
        return $localize`:@@writtenLanguageEN-US:English (US)`;
      case 'es-ES':
      case 'es':
        return $localize`:@@writtenLanguageES-ES:Spanish`;
      case 'fr-FR':
      case 'fr':
        return $localize`:@@writtenLanguageFR-FR:French`;
      default:
        return languageCode;
      // return $localize`:@@writtenLanguageUnknown:Unknown`;
    }
  }
}
