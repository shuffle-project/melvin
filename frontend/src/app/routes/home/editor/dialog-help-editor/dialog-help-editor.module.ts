import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { DialogHelpEditorComponent } from './dialog-help-editor.component';

@NgModule({
    imports: [CommonModule, SharedModule, DialogHelpEditorComponent],
})
export class DialogHelpEditorModule {}
