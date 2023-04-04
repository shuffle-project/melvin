import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsMongoId, IsString } from 'class-validator';
import {
  HydratedDocument,
  LeanDocument,
  PopulatedDoc,
  SchemaTypes,
  Types,
} from 'mongoose';
import {
  EXAMPLE_PROJECT,
  EXAMPLE_SPEAKER,
  EXAMPLE_TRANSCRIPTION,
  EXAMPLE_USER,
} from '../../../constants/example.constants';
import { Project } from './project.schema';
import { User } from './user.schema';

export type TranscriptionDocument = HydratedDocument<Transcription>;

export type LeanTranscriptionDocument = LeanDocument<TranscriptionDocument>;

@Schema({
  timestamps: true,
})
export class Speaker {
  @ApiProperty({ name: 'id', example: EXAMPLE_SPEAKER._id })
  @Expose({ name: 'id' })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Prop()
  @IsDate()
  createdAt?: Date;

  @ApiProperty()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty({ example: EXAMPLE_SPEAKER.name })
  @Prop()
  @IsString()
  name: string;
}

@Schema({
  timestamps: true,
})
export class Transcription {
  @ApiProperty({ name: 'id', example: EXAMPLE_TRANSCRIPTION._id })
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

  @ApiProperty({ type: String, example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsMongoId()
  @Transform(({ obj }) => obj.createdBy.toString())
  createdBy: PopulatedDoc<User>;

  @ApiProperty()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty({ type: String, example: EXAMPLE_PROJECT._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.project.toString())
  project: PopulatedDoc<Project>;

  @ApiProperty({ example: EXAMPLE_TRANSCRIPTION.title })
  @Prop()
  @IsString()
  title: string;

  @ApiProperty({ example: EXAMPLE_TRANSCRIPTION.language })
  @Prop()
  @IsString()
  language: string; // 'de-DE', 'en-US'

  @ApiProperty({ type: [Speaker] })
  @Prop()
  @Type(() => Speaker)
  speakers: Speaker[];
}

export const TranscriptionSchema = SchemaFactory.createForClass(Transcription);
