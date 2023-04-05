import { FormGroup } from '@angular/forms';
import { Language } from 'src/app/services/api/entities/config.entity';
import { ASRGroup } from './dialog-create-project.interfaces';

export const nameWithoutExtension = (file: File) => {
  return file.name.substring(0, file.name.lastIndexOf('.'));
};

export const getFileExtension = (filename: string): string => {
  return filename.substring(filename.lastIndexOf('.'), filename.length);
};

export const findVideoFile = (files: File[]) => {
  return files.find(
    (file: File) => file.type.includes('audio') || file.type.includes('video')
  );
};

export const findVideoFileWithLanguage = (
  files: { content: File; language: string }[]
) => {
  return files.find(
    (file) =>
      file.content?.type.includes('audio') ||
      file.content?.type.includes('video')
  );
};

export const findSubtitleFiles = (files: File[]) => {
  return files.filter((o) =>
    ['.vtt', '.srt'].includes(getFileExtension(o.name))
  );
};

export const getSelectedVendorLanguage = (asrGroup: FormGroup<ASRGroup>) => {
  return (asrGroup.controls.language.value as string).split('-')[0];
};

export const createLongLanguageCode = (language: string) => {
  return language + '-' + language.toUpperCase();
};

export const findFittingVendorLanguage = (
  vendorLanguages: Language[],
  searchedLanguage: string
) => {
  const langCodeLong = createLongLanguageCode(searchedLanguage);
  const langCodeShort = searchedLanguage;

  let fittingVendorLanguage = vendorLanguages.find(
    (language) => language.code === langCodeLong
  );

  if (fittingVendorLanguage) {
    return fittingVendorLanguage.code;
  } else {
    fittingVendorLanguage = vendorLanguages.find(
      (language) => language.code.split('-')[0] === langCodeShort
    );

    if (fittingVendorLanguage) {
      return fittingVendorLanguage.code;
    }
  }

  return null;
};
