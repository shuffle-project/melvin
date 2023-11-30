import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'writtenOutLanguage',
    standalone: true,
})
export class WrittenOutLanguagePipe implements PipeTransform {
  transform(languageCode: string) {
    switch (languageCode) {
      case 'de-DE':
        return $localize`:@@writtenLanguageDE-DE:German`;
      case 'en-GB':
        return $localize`:@@writtenLanguageEN-GB:English`;
      case 'en-US':
        return $localize`:@@writtenLanguageEN-US:English`;
      case 'es-ES':
        return $localize`:@@writtenLanguageES-ES:Spanish`;
      case 'fr-FR':
        return $localize`:@@writtenLanguageFR-FR:French`;
      default:
        return $localize`:@@writtenLanguageUnknown:Unknown`;
    }
  }
}
