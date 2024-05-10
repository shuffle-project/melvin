import {
  CdkMenuItem,
  CdkMenuItemCheckbox,
  CdkMenuItemSelectable,
} from '@angular/cdk/menu';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[appCdkMenuItemCheckbox]',
  standalone: true,
  providers: [
    {
      provide: CdkMenuItemCheckbox,
      useExisting: MenuItemCheckboxDirective,
    },
    { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemCheckbox },
    { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
  ],
})
export class MenuItemCheckboxDirective extends CdkMenuItemCheckbox {
  @Input() appKeepMenuOpen: boolean | undefined = undefined;

  override trigger(options?: { keepOpen: boolean }) {
    super.trigger(
      this.appKeepMenuOpen !== undefined
        ? { ...options, keepOpen: this.appKeepMenuOpen }
        : options
    );
  }
}
