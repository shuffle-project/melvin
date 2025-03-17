import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-dialog-spellcheck-info',
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatTabsModule],
  templateUrl: './dialog-spellcheck-info.component.html',
  styleUrl: './dialog-spellcheck-info.component.scss',
})
export class DialogSpellcheckInfoComponent {
  firefoxResourceLink = $localize.locale?.includes('de')
    ? 'https://addons.mozilla.org/de/firefox/language-tools/'
    : 'https://addons.mozilla.org/en-US/firefox/language-tools/';
}
