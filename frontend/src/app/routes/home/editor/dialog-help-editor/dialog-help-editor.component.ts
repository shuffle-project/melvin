import { Component } from '@angular/core';

interface Shortcut {
  key: string[];
  command: string;
}

@Component({
  selector: 'app-dialog-help-editor',
  styleUrls: ['./dialog-help-editor.component.scss'],
  templateUrl: './dialog-help-editor.component.html',
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
    ];

    this.shortcuts = navigator.userAgent.includes('Mac')
      ? shortcutsMac
      : shortcutsWindows;
  }
}
