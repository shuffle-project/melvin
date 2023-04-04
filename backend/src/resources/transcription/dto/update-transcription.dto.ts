import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTranscriptionDto } from './create-transcription.dto';

export class UpdateTranscriptionDto extends PartialType(
  OmitType(CreateTranscriptionDto, ['project'] as const),
) {}
