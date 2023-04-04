import { PickType } from '@nestjs/swagger';
import { Caption } from '../../../modules/db/schemas/caption.schema';

export class CreateCaptionDto extends PickType(Caption, [
  'transcription',
  'text',
  'start',
  'end',
  'speakerId',
] as const) {}
