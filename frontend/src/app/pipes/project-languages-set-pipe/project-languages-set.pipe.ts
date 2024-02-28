import { Pipe, PipeTransform } from '@angular/core';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';

@Pipe({
  name: 'projectLanguagesSet',
  standalone: true,
})
export class ProjectLanguagesSetPipe implements PipeTransform {
  transform(project: ProjectEntity) {
    // Set will filter duplicates
    return [
      ...new Set(
        project.transcriptions.map((transcription) => transcription.language)
      ),
    ];
  }
}
