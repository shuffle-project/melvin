import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  public getCssVariableValue(name: string): string {
    return getComputedStyle(this.document.body)
      .getPropertyValue(name)
      ?.replace(/\s/, '');
  }
}
