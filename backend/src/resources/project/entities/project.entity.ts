import { Prop } from '@nestjs/mongoose';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
import { PopulatedDoc } from 'mongoose';
import {
  Audio,
  Project,
  Video,
} from '../../../modules/db/schemas/project.schema';
import { Transcription } from '../../../modules/db/schemas/transcription.schema';
import { UserEntity } from '../../user/entities/user.entity';

@Exclude()
export class ProjectTranscriptionEntity extends PickType(Transcription, [
  '_id',
  'language',
] as const) {
  @Expose()
  language: string;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt: Date;
}

export class Resolution {
  @ApiProperty({ example: '1080p' })
  @Prop()
  @IsString()
  resolution: string;

  @ApiProperty()
  @Prop()
  @IsInt()
  height: number;

  @ApiProperty()
  @Prop()
  @IsInt()
  width: number;
}

export class VideoEntity extends Video {
  @ApiProperty({ type: [Resolution] })
  @Type(() => Resolution)
  resolutions: Resolution[];

  @ApiProperty({ type: String })
  @Type(() => String)
  url: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  mimetype: string;
}

export class AudioEntity extends Audio {
  @ApiProperty({ type: String })
  @Type(() => String)
  url: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  mimetype: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  waveform: string;
}

export class ProjectMediaEntity {
  @ApiProperty({ type: [AudioEntity] })
  @Type(() => AudioEntity)
  audios: AudioEntity[];

  @ApiProperty({ type: [VideoEntity] })
  @Type(() => VideoEntity)
  videos: VideoEntity[];

  // files: FileEntity[];
}

export class ProjectEntity extends OmitType(Project, [
  'transcriptions',
  'users',
  'createdBy',
  'audios',
  'videos',
] as const) {
  @ApiProperty({ type: [ProjectTranscriptionEntity] })
  @Type(() => ProjectTranscriptionEntity)
  transcriptions: PopulatedDoc<Transcription>[];

  @ApiProperty({ type: UserEntity })
  @Type(() => UserEntity)
  createdBy: PopulatedDoc<UserEntity>;

  @ApiProperty({ type: [UserEntity] })
  @Type(() => UserEntity)
  users: PopulatedDoc<UserEntity>[];
}
