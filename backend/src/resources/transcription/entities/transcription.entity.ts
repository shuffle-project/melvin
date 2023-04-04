import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PopulatedDoc } from 'mongoose';
import { Transcription } from '../../../modules/db/schemas/transcription.schema';
import { User } from '../../../modules/db/schemas/user.schema';

@Exclude()
export class TranscriptionUserEntity extends PickType(User, [
  '_id',
  'name',
] as const) {
  @Expose()
  name: string;
}

export class TranscriptionEntity extends OmitType(Transcription, [
  'createdBy',
]) {
  @ApiProperty({ type: TranscriptionUserEntity })
  @Type(() => TranscriptionUserEntity)
  createdBy: PopulatedDoc<User>;
}
