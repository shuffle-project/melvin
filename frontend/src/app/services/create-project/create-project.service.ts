import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  MemberEntry,
  MemberEntryType,
} from 'src/app/constants/member.constants';
import {
  ASRGroup,
  LiveGroup,
  ProjectGroup,
  VideoGroup,
} from 'src/app/routes/home/project-list/dialog-create-project/dialog-create-project.interfaces';
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

@Injectable()
export class CreateProjectService {
  private formData = new FormData();
  private data: Data = { title: '', language: '', sourceMode: 'video' };

  create(formGroup: FormGroup<ProjectGroup>): FormData {
    const { metadataGroup, videoGroup, liveGroup } = formGroup.controls;
    const { title, sourceMode, members = [] } = metadataGroup.getRawValue();

    this.data.title = title;
    this.data.sourceMode = sourceMode;

    const emails = this._getMemberEmails(members);
    if (emails.length > 0) this.data.emails = emails;

    sourceMode === 'video'
      ? this._createVideoProject(videoGroup)
      : this._createLiveProject(liveGroup);

    Object.entries(this.data).forEach((o) => {
      const key = o[0];
      const value = o[1];
      this.formData.append(key, value);
    });

    return this.formData;
  }

  private _createVideoProject(videoGroup: FormGroup<VideoGroup>) {
    const { activated: asrActivated } = videoGroup.controls.asrGroup.value;

    const videoFile = videoGroup.value.uploadedFiles!.find(
      (file) =>
        file.content!.type.includes('audio') ||
        file.content!.type.includes('video')
    ) as { content: File; language: string };

    this.formData.append('video', videoFile.content);
    this.data.language = videoFile.language;
    this.data.videoLanguage = videoFile.language;

    const subtitleFiles = (
      videoGroup.value.uploadedFiles as Array<{
        content: File;
        language: string;
      }>
    ).filter((file) => file.content.name !== videoFile.content.name);

    if (subtitleFiles.length > 0) {
      this.data.subtitleLanguages = subtitleFiles.map(
        (files) => files.language!
      );
      subtitleFiles.forEach((file) => {
        this.formData.append('subtitles', file.content!);
      });
    }

    if (asrActivated) this._useASRData(videoGroup.controls.asrGroup);
  }

  private _createLiveProject(liveGroup: FormGroup<LiveGroup>) {
    const language = liveGroup.controls.settings.getRawValue().language;
    const url = liveGroup.controls.url.value;
    const { activated: asrActivated } = liveGroup.controls.asrGroup.value;

    this.data.language = language;
    this.data.url = url;

    if (asrActivated) this._useASRData(liveGroup.controls.asrGroup);
  }

  private _useASRData(asrGroup: FormGroup<ASRGroup>) {
    const { asrVendor, language: asrLanguage } = asrGroup.value;
    this.data.asrVendor = asrVendor;
    this.data.asrLanguage = asrLanguage;
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
