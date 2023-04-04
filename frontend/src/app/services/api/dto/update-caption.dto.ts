import { CaptionStatusEnum } from '../entities/caption.entity';
import { CreateCaptionDto } from './create-caption.dto';

export interface UpdateCaptionDto
  extends Partial<Omit<CreateCaptionDto, 'transcription'>> {
  status?: CaptionStatusEnum | null;
  lockedBy?: string | null;
}
