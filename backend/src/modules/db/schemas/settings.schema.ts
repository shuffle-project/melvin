import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { EXAMPLE_ACTIVITY } from '../../../constants/example.constants';

export type SettingsDocument = HydratedDocument<Settings>;

export type LeanSettingsDocument = Settings;

@Schema({
  timestamps: true,
})
export class Settings {
  @ApiProperty({ name: 'id', example: EXAMPLE_ACTIVITY._id })
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
  @Prop()
  @IsInt()
  dbSchemaVersion?: number;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
