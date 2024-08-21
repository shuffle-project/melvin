import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CreateProjectFormGroup } from 'src/app/routes/home/project-list/dialog-create-project/dialog-create-project/dialog-create-project.component';
import { AsrVendors } from '../api/dto/create-transcription.dto';
import { MediaCategory } from '../api/entities/project.entity';

interface VideoData {
  title: string;
  language: string;
  asrVendor: AsrVendors;
  videoLanguages: string;
  subtitleLanguages?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CreateProjectService {
  createVideoProject(formGroup: FormGroup<CreateProjectFormGroup>): FormData {
    const formData = new FormData();
    const videoData: VideoData = {
      title: formGroup.controls.title.getRawValue(),
      language: '',
      asrVendor: AsrVendors.WHISPER,
      videoLanguages: '',
      subtitleLanguages: [],
    };

    const language = formGroup.controls.files.value.find((f) => {
      return f.fileType === 'video' && f.category === MediaCategory.MAIN;
    })?.language;

    return formData;

    // const { metadataGroup, videoGroup, liveGroup } = formGroup.controls;
    // const { title, sourceMode, members = [] } = metadataGroup.getRawValue();
    // data.title = title;
    // data.sourceMode = sourceMode;
    // const emails = this._getMemberEmails(members);
    // if (emails.length > 0) {
    //   data.emails = emails;
    // }
    // sourceMode === 'video'
    //   ? this._createVideoProject(videoGroup, data, formData)
    //   : this._createLiveProject(liveGroup, data, formData);
    // Object.entries(data).forEach((o) => {
    //   const key = o[0];
    //   const value = o[1];
    //   formData.append(key, value);
    // });
  }

  // private _createVideoProject(
  //   videoGroup: FormGroup<VideoGroup>,
  //   data: Data,
  //   formData: FormData
  // ) {
  //   const { activated: asrActivated } = videoGroup.controls.asrGroup.value;

  //   const videoFile = videoGroup.value.uploadedFiles!.find(
  //     (file) =>
  //       file.content!.type.includes('audio') ||
  //       file.content!.type.includes('video')
  //   ) as { content: File; language: string };

  //   formData.append('video', videoFile.content);
  //   data.language = videoFile.language;
  //   data.videoLanguage = videoFile.language;

  //   const subtitleFiles = (
  //     videoGroup.value.uploadedFiles as Array<{
  //       content: File;
  //       language: string;
  //     }>
  //   ).filter((file) => file.content.name !== videoFile.content.name);

  //   if (subtitleFiles.length > 0) {
  //     data.subtitleLanguages = subtitleFiles.map((files) => files.language!);
  //     subtitleFiles.forEach((file) => {
  //       formData.append('subtitles', file.content!);
  //     });
  //   }

  // if (asrActivated) this._useASRData(videoGroup.controls.asrGroup, data);
  // }
}
