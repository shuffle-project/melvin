import { MediaCategory } from '../entities/project.entity';

export interface UploadVideoDto {
  title: string;
  category: MediaCategory;
  recorder: boolean;
}
