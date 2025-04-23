import { MediaCategory } from '../entities/project.entity';

export interface UploadVideoDto {
  title: string;
  uploadId: string;
  category: MediaCategory;
  recorder: boolean;
}
