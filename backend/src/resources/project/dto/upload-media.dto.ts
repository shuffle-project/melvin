import { PartialType, PickType } from '@nestjs/swagger';
import { Video } from '../../../modules/db/schemas/project.schema';

export class UploadVideoDto extends PartialType(
  PickType(Video, ['title', 'category'] as const),
) {
  recorder: boolean;

  uploadId: string;
}
