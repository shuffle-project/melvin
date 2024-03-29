import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortLanguageCode',
  standalone: true,
})
export class LanguageCodePipe implements PipeTransform {
  getShortCode(longCode: string) {
    return longCode.toUpperCase().split('-')[0];
  }

  transform(value: string | string[]) {
    if (value) {
      if (typeof value === 'string') {
        return this.getShortCode(value);
      } else {
        return value.map((lang) => ' ' + this.getShortCode(lang)).toString();
      }
    } else {
      return '';
    }
  }
}
