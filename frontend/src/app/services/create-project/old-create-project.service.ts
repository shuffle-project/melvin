import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  MemberEntry,
  MemberEntryType,
} from 'src/app/constants/member.constants';
import { CreateProjectFormGroup } from 'src/app/routes/home/project-list/dialog-create-project/dialog-create-project/dialog-create-project.component';
import {
  ASRGroup,
  LiveGroup,
  VideoGroup,
} from 'src/app/routes/home/project-list/old-dialog-create-project/dialog-create-project.interfaces';
import { AsrVendors } from '../api/dto/create-transcription.dto';

interface Data {
  title: string;
  language: string;
  sourceMode: 'video' | 'live';
  emails?: string[];
  asrVendor?: AsrVendors | '';
  asrLanguage?: string;
  videoLanguage?: string;
  subtitleLanguages?: string[];
  url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreateProjectService {
  create(formGroup: FormGroup<CreateProjectFormGroup>): FormData {
    console.log(' vvv ');
    console.log(formGroup);
    const formData = new FormData();

    // const data: Data = { title: '', language: '', sourceMode: 'video' };
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
    return formData;
  }

  private _createVideoProject(
    videoGroup: FormGroup<VideoGroup>,
    data: Data,
    formData: FormData
  ) {
    const { activated: asrActivated } = videoGroup.controls.asrGroup.value;

    const videoFile = videoGroup.value.uploadedFiles!.find(
      (file) =>
        file.content!.type.includes('audio') ||
        file.content!.type.includes('video')
    ) as { content: File; language: string };

    formData.append('video', videoFile.content);
    data.language = videoFile.language;
    data.videoLanguage = videoFile.language;

    const subtitleFiles = (
      videoGroup.value.uploadedFiles as Array<{
        content: File;
        language: string;
      }>
    ).filter((file) => file.content.name !== videoFile.content.name);

    if (subtitleFiles.length > 0) {
      data.subtitleLanguages = subtitleFiles.map((files) => files.language!);
      subtitleFiles.forEach((file) => {
        formData.append('subtitles', file.content!);
      });
    }

    if (asrActivated) this._useASRData(videoGroup.controls.asrGroup, data);
  }

  private _createLiveProject(
    liveGroup: FormGroup<LiveGroup>,
    data: Data,
    formData: FormData
  ) {
    const language = liveGroup.controls.settings.getRawValue().language;
    const url = liveGroup.controls.url.value;
    const { activated: asrActivated } = liveGroup.controls.asrGroup.value;

    data.language = language;
    data.url = url;

    if (asrActivated) this._useASRData(liveGroup.controls.asrGroup, data);
  }

  private _useASRData(asrGroup: FormGroup<ASRGroup>, data: Data) {
    const { asrVendor, language: asrLanguage } = asrGroup.value;
    data.asrVendor = asrVendor;
    data.asrLanguage = asrLanguage;
  }

  private _getMemberEmails(members: MemberEntry[]) {
    return members.map((entry: MemberEntry) => {
      if (entry.type === MemberEntryType.USER) {
        return entry.user?.email as string;
      } else if (entry.type === MemberEntryType.VALID_EMAIL) {
        return entry.unknownEmail as string;
      }
      return 'unknown';
    });
  }
}
