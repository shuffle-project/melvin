import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsString,
} from 'class-validator';
import {
  HydratedDocument,
  LeanDocument,
  PopulatedDoc,
  SchemaTypes,
  Types,
} from 'mongoose';
import {
  EXAMPLE_CAPTION,
  EXAMPLE_CAPTION_HISTORY,
  EXAMPLE_PROJECT,
  EXAMPLE_SPEAKER,
  EXAMPLE_TRANSCRIPTION,
  EXAMPLE_USER,
} from '../../../constants/example.constants';
import { Project } from './project.schema';
import { Transcription } from './transcription.schema';
import { User } from './user.schema';

export type CaptionDocument = HydratedDocument<Caption>;

export type LeanCaptionDocument = LeanDocument<CaptionDocument>;

export enum CaptionStatus {
  FLAGGED = 'flagged',
  FINISHED = 'finished',
}

@Schema({
  timestamps: true,
})
export class CaptionHistory {
  @ApiProperty({ name: 'id', example: EXAMPLE_CAPTION_HISTORY._id })
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

  @ApiProperty({ example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.createdBy.toString())
  createdBy: PopulatedDoc<User>;

  @ApiProperty({ example: EXAMPLE_CAPTION_HISTORY.text })
  @Prop()
  @IsString()
  text: string;
}
const CaptionHistorySchema = SchemaFactory.createForClass(CaptionHistory);

@Schema({
  timestamps: true,
})
export class Caption {
  @ApiProperty({ name: 'id', example: EXAMPLE_CAPTION._id })
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

  @ApiProperty({ example: EXAMPLE_PROJECT._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.project?.toString())
  project: PopulatedDoc<Project>;

  @ApiProperty({ example: EXAMPLE_TRANSCRIPTION._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Transcription' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.transcription?.toString())
  transcription: PopulatedDoc<Transcription>;

  @ApiProperty({ example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.updatedBy?.toString())
  updatedBy: PopulatedDoc<User>;

  @ApiProperty()
  @Prop()
  @IsBoolean()
  wasManuallyEdited: boolean;

  @ApiProperty({ example: EXAMPLE_CAPTION.initialText })
  @Prop()
  @IsString()
  initialText: string;

  @ApiProperty({ example: EXAMPLE_CAPTION.text })
  @Prop()
  @IsString()
  text: string;

  @ApiProperty({ example: EXAMPLE_CAPTION.start })
  @Prop()
  @IsInt()
  start: number;

  @ApiProperty({ example: EXAMPLE_CAPTION.end })
  @Prop()
  @IsInt()
  end: number;

  @ApiProperty({ example: EXAMPLE_SPEAKER._id })
  @Prop({ type: SchemaTypes.ObjectId })
  @IsMongoId()
  @Transform(({ obj }) => obj.speakerId?.toString())
  speakerId: string;

  @ApiProperty({ example: EXAMPLE_USER._id })
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.lockedBy?.toString() || null)
  lockedBy: PopulatedDoc<User>;

  @ApiProperty({ enum: CaptionStatus })
  @Prop({ default: null })
  @IsEnum(CaptionStatus)
  status: CaptionStatus;

  @ApiProperty({ type: [CaptionHistory] })
  @Prop({ type: [CaptionHistorySchema] })
  @Type(() => CaptionHistory)
  history: CaptionHistory[];
}

export const CaptionSchema = SchemaFactory.createForClass(Caption);
