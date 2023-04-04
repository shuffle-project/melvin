import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsString } from 'class-validator';
import { HydratedDocument, PopulatedDoc, SchemaTypes, Types } from 'mongoose';
import { EXAMPLE_EXPORT } from '../../../constants/example.constants';
import { Project } from './project.schema';

export type ExportDocument = HydratedDocument<Export>;

enum ExportType {
  VIDEO = 'video',
  SUBTITLES = 'subtitles',
}

enum ExportStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  FINISHED = 'finished',
}

@Schema({
  timestamps: true,
})
export class Export {
  @ApiProperty({ name: 'id', example: EXAMPLE_EXPORT._id })
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

  @ApiProperty()
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.project.toString())
  project: PopulatedDoc<Project>;

  @ApiProperty({ enum: ExportStatus })
  @Prop()
  @IsEnum(ExportStatus)
  status: ExportStatus;

  @ApiProperty({ enum: ExportType })
  @Prop()
  @IsEnum(ExportType)
  type: ExportType;

  @ApiProperty({ example: EXAMPLE_EXPORT.extension })
  @Prop()
  @IsString()
  extension: string; // mp4, zip
}

export const ExportSchema = SchemaFactory.createForClass(Export);
