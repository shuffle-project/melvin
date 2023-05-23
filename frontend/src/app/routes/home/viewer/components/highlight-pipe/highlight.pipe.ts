import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
})
export class HighlightPipe implements PipeTransform {
  transform(value: string, searchString: string): string {
    // if (searchString.length < 1) {
    //   return value;
    // }
    // let regex = new RegExp(searchString, 'gi');
    // if (value.search(regex) < 0) {
    //   return value;
    // }
    // return value.replace(regex, '<mark>' + searchString + '</mark>');
    return value;
  }
}
