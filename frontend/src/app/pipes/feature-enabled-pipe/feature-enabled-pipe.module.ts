import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FeatureEnabledPipe } from './feature-enabled.pipe';

@NgModule({
  declarations: [FeatureEnabledPipe],
  imports: [CommonModule],
  exports: [FeatureEnabledPipe],
})
export class FeatureEnabledPipeModule {}
