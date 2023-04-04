import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsMongoId } from 'class-validator';
import {
  HydratedDocument,
  LeanDocument,
  PopulatedDoc,
  SchemaTypes,
  Types,
} from 'mongoose';
import {
  EXAMPLE_ACTIVITY,
  EXAMPLE_NOTIFICATION,
  EXAMPLE_USER,
} from '../../../constants/example.constants';
import { Activity } from './activity.schema';
import { User } from './user.schema';

export type NotificationDocument = HydratedDocument<Notification>;

export type LeanNotificationDocument = LeanDocument<NotificationDocument>;

export enum NotificationAction {
  PROJECT_CREATED = 'project-created',
}

@Schema({
  timestamps: true,
})
export class Notification {
  @ApiProperty({ name: 'id', example: EXAMPLE_NOTIFICATION._id })
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
  @Transform(({ obj }) => obj.user.toString())
  user: PopulatedDoc<User>;

  @ApiProperty({ type: String, example: EXAMPLE_ACTIVITY._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Activity' })
  @IsMongoId()
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.activity.toString())
  activity: PopulatedDoc<Activity>;

  @ApiProperty({ example: EXAMPLE_NOTIFICATION.read })
  @Prop({ default: false })
  @IsBoolean()
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
