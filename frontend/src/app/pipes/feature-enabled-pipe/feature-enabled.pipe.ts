import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EnabledFeatures } from '../../../environments/environment.interface';

@Pipe({
  name: 'featureEnabled',
  standalone: true,
})
@Injectable({ providedIn: 'root' })
export class FeatureEnabledPipe implements PipeTransform {
  transform(value: keyof EnabledFeatures): unknown {
    return environment.features[value] ?? false;
  }
}
