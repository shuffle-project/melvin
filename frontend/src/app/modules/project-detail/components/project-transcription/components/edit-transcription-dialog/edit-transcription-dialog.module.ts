import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { EditTranscriptionDialogComponent } from './edit-transcription-dialog.component';

@NgModule({
    imports: [CommonModule, SharedModule, EditTranscriptionDialogComponent],
    exports: [EditTranscriptionDialogComponent],
})
export class EditTranscriptionDialogModule {}
