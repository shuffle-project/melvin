import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDate, IsMongoId } from 'class-validator';
import { HydratedDocument, PopulatedDoc, SchemaTypes, Types } from 'mongoose';
import {
  EXAMPLE_ACTIVITY,
  EXAMPLE_PROJECT,
  EXAMPLE_USER,
} from '../../../constants/example.constants';
import {
  ActivityAction,
  ActivityDetails,
} from '../../../resources/activity/activity.interfaces';
import { Project } from './project.schema';
import { User } from './user.schema';

export type ActivityDocument = HydratedDocument<Activity>;

export type LeanActivityDocument = Activity;

@Schema({
  timestamps: true,
})
export class Activity {
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

  @ApiProperty({ type: String, example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.createdBy.toString())
  createdBy: PopulatedDoc<User>;

  @ApiProperty({ example: EXAMPLE_PROJECT._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.project.toString())
  project: PopulatedDoc<Project>;

  @ApiProperty({ example: EXAMPLE_ACTIVITY.action })
  @Prop({ type: String })
  action: ActivityAction;

  @ApiProperty({ example: EXAMPLE_ACTIVITY.details })
  @Prop({ type: Object })
  details: ActivityDetails;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
