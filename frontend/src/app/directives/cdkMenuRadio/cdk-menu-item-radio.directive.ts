import {
  CdkMenuItem,
  CdkMenuItemRadio,
  CdkMenuItemSelectable,
} from '@angular/cdk/menu';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[appCdkMenuItemRadio]',
  standalone: true,
  providers: [
    {
      provide: CdkMenuItemRadio,
      useExisting: MenuItemRadioDirective,
    },
    { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio },
    { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
  ],
})
export class MenuItemRadioDirective extends CdkMenuItemRadio {
  @Input() appKeepMenuOpen: boolean | undefined = undefined;

  override trigger(options?: { keepOpen: boolean }) {
    super.trigger(
      this.appKeepMenuOpen !== undefined
        ? { ...options, keepOpen: this.appKeepMenuOpen }
        : options
    );
  }
}
