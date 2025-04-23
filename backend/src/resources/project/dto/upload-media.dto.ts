import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { Video } from '../../../modules/db/schemas/project.schema';

export class UploadVideoDto extends PartialType(
  PickType(Video, ['title', 'category'] as const),
) {
  @ApiProperty({ required: true })
  @IsString()
  uploadId: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  recorder?: boolean;
}
