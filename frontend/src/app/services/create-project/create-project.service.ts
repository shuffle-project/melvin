import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CreateProjectFormGroup } from 'src/app/routes/home/project-list/dialog-create-project/dialog-create-project/dialog-create-project.component';
import { AsrVendors } from '../api/dto/create-transcription.dto';

interface CreateProjectFormData {
  title: string;
  language: string;
  asrVendor: AsrVendors;
  videoOptions: string; // { category: string; useAudio: string }[];
  subtitleOptions?: string; //{ language: string };
  // videoFiles
  // subtitleFiles?
}

@Injectable({
  providedIn: 'root',
})
export class CreateProjectService {
  createVideoProject(formGroup: FormGroup<CreateProjectFormGroup>): FormData {
    const formData = new FormData();
    const createProjectFormData: CreateProjectFormData = {
      title: formGroup.controls.title.getRawValue(),
      language: '',
      asrVendor: AsrVendors.WHISPER,
      videoOptions: '',
    };

    const mainLanguage = this._getMainLanguage(formGroup);
    console.log('mainLanguage: ' + mainLanguage);
    createProjectFormData.language = mainLanguage;

    const subtitleOptions = formGroup.controls.files
      .getRawValue()
      .filter((f) => {
        {
          return f.fileType === 'text';
        }
      })
      .map((f) => {
        return { language: f.language };
      });

    if (subtitleOptions.length > 0) {
      createProjectFormData.subtitleOptions = JSON.stringify(subtitleOptions);
    }

    const videoData = formGroup.controls.files
      .getRawValue()
      .filter((f) => {
        {
          return f.fileType === 'video';
        }
      })
      .map((f) => {
        return { category: f.category, useAudio: f.useAudio };
      });

    createProjectFormData.videoOptions = JSON.stringify(videoData);

    formGroup.controls.files.getRawValue().forEach((f) => {
      if (f.fileType === 'text') {
        formData.append('subtitles', f.file);
      } else if (f.fileType === 'video') {
        formData.append('videos', f.file);
      }
    });

    Object.entries(createProjectFormData).forEach((e) => {
      const key = e[0];
      const value = e[1];
      formData.append(key, value);
    });

    return formData;
  }

  public _getMainLanguage(formGroup: FormGroup<CreateProjectFormGroup>) {
    const useAudioFiles = formGroup.controls.files
      .getRawValue()
      .filter((f) => f.useAudio);

    return useAudioFiles[0].language;
  }
}
