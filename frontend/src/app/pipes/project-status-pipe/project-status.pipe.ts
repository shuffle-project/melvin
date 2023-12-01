import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { ProjectStatus } from 'src/app/services/api/entities/project.entity';

@Pipe({
  name: 'readableStatus',
  standalone: true,
})
@Injectable({ providedIn: 'root' })
export class ProjectStatusPipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case ProjectStatus.DRAFT:
        return $localize`:@@projectStatusDraft:Draft`;
      case ProjectStatus.FINISHED:
        return $localize`:@@projectStatusFinished:Finished`;
      case ProjectStatus.WAITING:
        return $localize`:@@projectStatusWaiting:In queue`;
      case ProjectStatus.LIVE:
        return $localize`:@@projectStatusLive:Live`;
      case ProjectStatus.PROCESSING:
        return $localize`:@@projectStatusProcessing:Processing`;
      case ProjectStatus.ERROR:
        return $localize`:@@projectStatusError:Error`;
      default:
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
  }
}
