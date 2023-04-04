import { CreateTranscriptionDto } from './create-transcription.dto';

export interface UpdateTranscriptionDto
  extends Partial<Omit<CreateTranscriptionDto, 'project'>> {}
