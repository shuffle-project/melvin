import { PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  Livestream,
  Project,
} from '../../../modules/db/schemas/project.schema';

class UpdatePartialLivestreamDto extends PartialType(Livestream) {}

export class UpdatePartialProjectDto extends PartialType(
  PickType(Project, ['duration', 'status'] as const),
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePartialLivestreamDto)
  livestream?: UpdatePartialLivestreamDto;
}
