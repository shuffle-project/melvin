import { Pipe, PipeTransform } from '@angular/core';
import { MediaCategory } from '../../services/api/entities/project.entity';

@Pipe({
  name: 'mediaCategory',
  standalone: true,
})
export class MediaCategoryPipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case MediaCategory.MAIN:
        return $localize`:@@mediaCategoryMain:Main`;

      case MediaCategory.OTHER:
        return $localize`:@@mediaCategoryOther:Other`;

      case MediaCategory.SIGN_LANGUAGE:
        return $localize`:@@mediaCategorySignLanguage:Sign Language`;

      case MediaCategory.SLIDES:
        return $localize`:@@mediaCategorySlides:Slides`;

      case MediaCategory.SPEAKER:
        return $localize`:@@mediaCategorySpeaker:Speaker`;

      default:
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
  }
}
