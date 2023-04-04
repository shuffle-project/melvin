import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MemberEntry } from 'src/app/constants/member.constants';
import { AsrVendors } from '../../../../services/api/dto/create-transcription.dto';

export interface ProjectGroup {
  metadataGroup: FormGroup<MetadataGroup>;
  videoGroup: FormGroup<VideoGroup>;
  liveGroup: FormGroup<LiveGroup>;
}

export interface LiveGroup {
  url: FormControl<string>;
  settings: FormGroup<{ language: FormControl<string | ''> }>;
  asrGroup: FormGroup<ASRGroup>;
}

export interface MetadataGroup {
  sourceMode: FormControl<'video' | 'live'>;
  title: FormControl<string>;
  members: FormControl<MemberEntry[]>;
}

export interface VideoGroup {
  files: FormControl<File[]>;
  uploadedFiles: FormArray<
    FormGroup<{
      content: FormControl<File>;
      language: FormControl<string>;
    }>
  >;
  asrGroup: FormGroup<ASRGroup>;
}

export interface ASRGroup {
  activated: FormControl<Boolean>;
  asrVendor: FormControl<AsrVendors | ''>;
  language: FormControl<string>;
}

export interface FileWithLanguage {
  content: File;
  language: string;
}
