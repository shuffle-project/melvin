import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { ActivityModule } from '../activity/activity.module';
import { UploadFilesComponent } from './upload-files.component';

@NgModule({
    imports: [CommonModule, ActivityModule, SharedModule, UploadFilesComponent],
    exports: [UploadFilesComponent],
})
export class UploadFilesModule {}
