import { VideoCategory } from '../entities/project.entity';

export interface UploadVideoDto {
  title: string;
  category: VideoCategory;
}
