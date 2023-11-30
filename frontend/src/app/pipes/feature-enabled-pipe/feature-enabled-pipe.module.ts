import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FeatureEnabledPipe } from './feature-enabled.pipe';

@NgModule({
    imports: [CommonModule, FeatureEnabledPipe],
    exports: [FeatureEnabledPipe],
})
export class FeatureEnabledPipeModule {}
