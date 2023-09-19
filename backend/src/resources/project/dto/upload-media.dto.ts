import { PickType } from '@nestjs/swagger';
import { Video } from '../../../modules/db/schemas/project.schema';

export class UploadVideoDto extends PickType(Video, [
  'title',
  'category',
] as const) {}
