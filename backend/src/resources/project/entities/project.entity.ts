import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PopulatedDoc } from 'mongoose';
import {
  MediaCategory as MediaCategory,
  Project,
  VideoStatus,
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
}

export class VideoLinkEntity {
  @ApiProperty({ type: String })
  @Type(() => String)
  id: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  url: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  title: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  originalFileName: string;

  @ApiProperty({ enum: VideoStatus, example: VideoStatus.FINISHED })
  status: VideoStatus;

  @ApiProperty({ enum: MediaCategory, example: MediaCategory.OTHER })
  category: MediaCategory;
}

export class MediaLinksEntity {
  @ApiProperty({ type: String })
  @Type(() => String)
  video: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  audio: string;

  @ApiProperty({ type: [VideoLinkEntity] })
  @Type(() => VideoLinkEntity)
  videos: VideoLinkEntity[];
}

export class ProjectEntity extends OmitType(Project, [
  'transcriptions',
  'users',
] as const) {
  @ApiProperty({ type: [ProjectTranscriptionEntity] })
  @Type(() => ProjectTranscriptionEntity)
  transcriptions: PopulatedDoc<Transcription>[];

  @ApiProperty({ type: [UserEntity] })
  @Type(() => UserEntity)
  users: PopulatedDoc<UserEntity>[];

  @ApiPropertyOptional({ type: MediaLinksEntity })
  @Type(() => MediaLinksEntity)
  media?: MediaLinksEntity;
}
