import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsString,
} from 'class-validator';
import { HydratedDocument, PopulatedDoc, SchemaTypes, Types } from 'mongoose';
import { EXAMPLE_USER } from '../../../constants/example.constants';
import { UserRole } from '../../../resources/user/user.interfaces';
import { Project } from './project.schema';
import { Team } from './team.schema';

export type UserDocument = HydratedDocument<User>;

export type LeanUserDocument = User;

@Schema({
  timestamps: true,
})
export class User {
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

  @ApiProperty({ example: EXAMPLE_USER.email })
  @Prop({ index: true })
  @IsEmail()
  email: string;

  @Exclude()
  @Prop()
  @IsString()
  hashedPassword: string;

  @ApiProperty({ example: EXAMPLE_USER.name })
  @Prop()
  @IsString()
  name: string;

  @ApiProperty({ example: EXAMPLE_USER.role })
  @Prop({ default: 'user' })
  @IsEnum(UserRole)
  role: UserRole;

  // @Exclude()
  @ApiProperty({ example: true })
  @Prop({ default: false })
  @IsBoolean()
  isEmailVerified: boolean;

  @Exclude()
  @Prop({ index: true })
  @IsString()
  emailVerificationToken: string;

  @Exclude()
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Project' }] })
  //TODO https://github.com/typestack/class-transformer/issues/991
  @Transform(({ obj }) => obj.projects.map((o: Types.ObjectId) => o.toString()))
  projects: PopulatedDoc<Project>[];

  @ApiProperty({ example: -1 })
  @Prop()
  @IsNumber()
  sizeLimit: number | null;

  @ApiProperty({ type: String, example: EXAMPLE_USER._id })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Team', index: true })
  @IsMongoId()
  @Transform(({ obj }) => obj.team?.toString() ?? null)
  team: PopulatedDoc<Team> | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
