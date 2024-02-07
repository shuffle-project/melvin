import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsString,
  ValidateNested,
} from 'class-validator';
import { HydratedDocument, PopulatedDoc, SchemaTypes, Types } from 'mongoose';
import {
  EXAMPLE_EXPORT,
  EXAMPLE_PROJECT,
  EXAMPLE_TRANSCRIPTION,
  EXAMPLE_USER,
} from '../../../constants/example.constants';
import { Export } from './export.schema';
import { Transcription } from './transcription.schema';
import { User } from './user.schema';

export type ProjectDocument = HydratedDocument<Project>;

export type LeanProjectDocument = Project;

export enum ProjectStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  DRAFT = 'draft',
  LIVE = 'live',
  FINISHED = 'finished',
  ERROR = 'error',
}

export enum MediaStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  FINISHED = 'finished',
  ERROR = 'error',
}

export enum LivestreamStatus {
  NOT_CONNECTED = 'not_connected',
  STARTED = 'started',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export enum RecordingStatus {
  NOT_STARTED = 'not_started',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export enum RecordingTimestampType {
  START = 'start',
  STOP = 'stop',
}
export enum MediaCategory {
  MAIN = 'main',
  OTHER = 'other',
  SIGN_LANGUAGE = 'sign_language',
  SLIDES = 'slides',
  SPEAKER = 'speaker',
}

export class RecordingTimestamp {
  type: RecordingTimestampType;
  timestamp: Date;
}

@Schema({
  timestamps: true,
})
export class Audio {
  @ApiProperty({ name: 'id', example: EXAMPLE_PROJECT._id })
  @Expose({ name: 'id' })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Exclude()
  __v?: number;

  @ApiProperty()
  @Prop()
  @IsDate()
  createdAt?: Date;

  @ApiProperty()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty()
  @IsString()
  @Prop()
  title: string;

  @ApiProperty()
  @IsString()
  @Prop()
  originalFileName: string;

  @ApiProperty()
  @IsString()
  @Prop()
  extension: string;

  @ApiProperty({ enum: MediaCategory, example: MediaCategory.OTHER })
  @Prop()
  @IsEnum(MediaCategory)
  category: MediaCategory;

  @ApiProperty({ enum: MediaStatus, example: MediaStatus.FINISHED })
  @Prop()
  @IsEnum(MediaStatus)
  status: MediaStatus;
}
const AudioSchema = SchemaFactory.createForClass(Audio);

@Schema({
  timestamps: true,
})
export class Video {
  @ApiProperty({ name: 'id', example: EXAMPLE_PROJECT._id })
  @Expose({ name: 'id' })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Exclude()
  __v?: number;

  @ApiProperty()
  @Prop()
  @IsDate()
  createdAt?: Date;

  @ApiProperty()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty()
  @IsString()
  @Prop()
  title: string;

  @ApiProperty()
  @IsString()
  @Prop()
  originalFileName: string;

  @ApiProperty()
  @IsString()
  @Prop()
  extension: string;

  @ApiProperty({ enum: MediaCategory, example: MediaCategory.OTHER })
  @Prop()
  @IsEnum(MediaCategory)
  category: MediaCategory;

  @ApiProperty({ enum: MediaStatus, example: MediaStatus.FINISHED })
  @Prop()
  @IsEnum(MediaStatus)
  status: MediaStatus;
}
const VideoSchema = SchemaFactory.createForClass(Video);

@Schema({
  timestamps: true,
})
export class Livestream {
  @ApiProperty()
  @IsString()
  url?: string;

  @ApiProperty()
  @Prop({ default: null })
  @IsString()
  mediaPipelineId: string | null;

  @ApiProperty({
    enum: LivestreamStatus,
    example: LivestreamStatus.NOT_CONNECTED,
  })
  @Prop({ default: LivestreamStatus.NOT_CONNECTED })
  @IsEnum(LivestreamStatus)
  livestreamStatus: LivestreamStatus;

  @ApiProperty({
    enum: RecordingStatus,
    example: RecordingStatus.NOT_STARTED,
  })
  @Prop({ default: RecordingStatus.NOT_STARTED })
  @IsEnum(RecordingStatus)
  recordingStatus: RecordingStatus;

  @ApiProperty({ type: [RecordingTimestamp] })
  @Type(() => RecordingTimestamp)
  @Prop({ default: [] })
  recordingTimestamps: RecordingTimestamp[];
}

@Schema({
  timestamps: true,
})
export class Project {
  @ApiProperty({ name: 'id', example: EXAMPLE_PROJECT._id })
  @Expose({ name: 'id' })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @ApiProperty()
  @Prop()
  @IsDate()
  createdAt?: Date;

  @ApiProperty()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty({ type: String, example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsMongoId()
  @Transform(({ obj }) => obj.createdBy.toString())
  createdBy: PopulatedDoc<User>;

  @ApiProperty({ example: EXAMPLE_PROJECT.title })
  @Prop()
  @IsString()
  title: string;

  @ApiProperty({ type: [String], example: [EXAMPLE_USER._id] })
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }] })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.users.map((o: Types.ObjectId) => o.toString()))
  users: PopulatedDoc<User>[];

  @ApiProperty({ type: [String], example: [EXAMPLE_TRANSCRIPTION._id] })
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Transcription' }] })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) =>
    obj.transcriptions.map((o: Types.ObjectId) => o.toString()),
  )
  transcriptions: PopulatedDoc<Transcription>[];

  @ApiProperty({ enum: ProjectStatus, example: EXAMPLE_PROJECT.status })
  @Prop()
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiProperty({ example: EXAMPLE_PROJECT.duration })
  @Prop()
  @IsInt()
  duration: number;

  @ApiProperty({ example: EXAMPLE_PROJECT.start })
  @Prop()
  @IsInt()
  start: number;

  @ApiProperty({ example: EXAMPLE_PROJECT.end })
  @Prop()
  @IsInt()
  end: number;

  @ApiProperty({ example: EXAMPLE_PROJECT.language })
  @Prop()
  @IsString()
  language: string;

  @ApiProperty({ type: [String], example: [EXAMPLE_EXPORT._id] })
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Export' }] })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.exports.map((o: Types.ObjectId) => o.toString()))
  exports: PopulatedDoc<Export>[];

  @Exclude()
  @ApiProperty({ example: EXAMPLE_PROJECT.inviteToken })
  @Prop()
  @IsString()
  inviteToken: string;

  @ApiProperty({ type: Livestream })
  @Type(() => Livestream)
  @ValidateNested()
  @Prop()
  livestream: Livestream;

  @ApiProperty({ type: [Audio] })
  @Prop({ type: [AudioSchema] })
  @Type(() => Audio)
  // @Exclude()
  audios: Audio[];

  @ApiProperty({ type: [Video] })
  @Prop({ type: [VideoSchema] })
  @Type(() => Video)
  // @Exclude()
  videos: Video[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
