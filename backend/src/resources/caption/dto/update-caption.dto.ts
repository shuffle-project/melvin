import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Caption } from '../../../modules/db/schemas/caption.schema';
import { CreateCaptionDto } from './create-caption.dto';

export class UpdateCaptionDto extends PartialType(
  IntersectionType(
    OmitType(CreateCaptionDto, ['transcription'] as const),
    PickType(Caption, ['status', 'lockedBy'] as const),
  ),
) {}
