import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

interface Shortcut {
  key: string[];
  command: string;
}

@Component({
    selector: 'app-dialog-help-editor',
    styleUrls: ['./dialog-help-editor.component.scss'],
    templateUrl: './dialog-help-editor.component.html',
    standalone: true,
    imports: [
        MatTableModule,
        NgFor,
        NgIf,
    ],
})
export class DialogHelpEditorComponent {
  // Operating system detection to switch between mac keys and windows
  // https://www.npmjs.com/package/ngx-device-detector

  // Use icons or text for shift etc.

  displayedColumns = ['key', 'command'];

  shortcuts: Shortcut[];

  constructor() {
    const shortcutsMac = [
      {
        key: ['Command', 'S'],
        command: $localize`:@@editorHelpDialogShortcutCommandSaveProject:Save project`,
      },
      {
        key: ['Command', 'C'],
        command: $localize`:@@editorHelpDialogShortcutCommandCopy:Copy`,
      },
      {
        key: ['Command', 'Shift', '/'],
        command: $localize`:@@editorHelpDialogShortcutCommandToggleComment:Toggle Comment`,
      },
      {
        key: ['Backspace'],
        command:
          'Wenn der Cursor am Anfang des Textes ist, wird die Caption gelöscht. Ansonsten wird wie gewohnt das letzte Zeichen gelöscht.',
      },
      {
        key: ['Enter'],
        command: 'Verschiebe den Text ab dem Cursor in eine neue Caption.',
      },
      { key: ['Command', 'Enter'], command: 'Füge eine neue Zeile hinzu.' },
    ];

    const shortcutsWindows: Shortcut[] = [
      {
        key: ['STRG', 'S'],
        command: $localize`:@@editorHelpDialogShortcutCommandSaveProject:Save project`,
      },
      {
        key: ['STRG', 'C'],
        command: $localize`:@@editorHelpDialogShortcutCommandCopy:Copy`,
      },
      {
        key: ['STRG', 'Shift', '/'],
        command: $localize`:@@editorHelpDialogShortcutCommandToggleComment:Toggle Comment`,
      },
      {
        key: ['Backspace'],
        command:
          'Wenn der Cursor am Anfang des Textes ist, wird die Caption gelöscht. Ansonsten wird wie gewohnt das letzte Zeichen gelöscht.',
      },
      {
        key: ['Enter'],
        command:
          'Verschiebe den Text ab dem Cursor in die nächste Caption oder in eine neue Caption (wenn die aktuelle caption > 6 sekunden ist, wird sie gesplitted).',
      },
      {
        key: ['SHIFT', 'Enter'],
        command: 'Verschiebe den Text ab dem Cursor in eine neue Caption.',
      },
      { key: ['STRG', 'Enter'], command: 'Füge eine neue Zeile hinzu.' },
    ];

    this.shortcuts = navigator.userAgent.includes('Mac')
      ? shortcutsMac
      : shortcutsWindows;
  }
}
