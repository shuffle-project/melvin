import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '../../../components/header/header.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { RecorderRoutingModule } from './recorder-routing.module';
import { RecorderComponent } from './recorder.component';

@NgModule({
  declarations: [RecorderComponent],
  imports: [CommonModule, RecorderRoutingModule, HeaderModule, SharedModule],
})
export class RecorderModule {}
