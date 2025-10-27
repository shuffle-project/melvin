import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export type TeamDocument = HydratedDocument<Team>;

export type LeanTeamDocument = Team;

@Schema({
  timestamps: true,
})
export class Team {
  @ApiProperty({ name: 'id', example: EXAMPLE_USER._id })
  @Expose({ name: 'id' })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Exclude()
  @Prop()
  @IsDate()
  createdAt?: Date;

  @Exclude()
  @Prop()
  @IsDate()
  updatedAt?: Date;

  @ApiProperty({ example: 'Team ABC' })
  @Prop()
  @IsString()
  name: string;

  @ApiProperty({ example: -1 })
  @Prop()
  @IsNumber()
  sizeLimit: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
