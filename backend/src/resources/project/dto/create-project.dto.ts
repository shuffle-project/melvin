import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';
import { Project } from '../../../modules/db/schemas/project.schema';
import { AsrVendors } from '../../../processors/processor.interfaces';

export class CreateProjectDto extends PickType(Project, [
  'title',
  'language',
] as const) {
  @ApiProperty({
    type: [String],
    required: false,
    example: [EXAMPLE_USER.email],
  })
  // @Transform(({ value }) => {
  //   console.log(value);
  //   return value.split(',');
  // })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @Type(() => Array)
  emails?: string[];

  @ApiProperty({ enum: AsrVendors, required: false })
  @IsOptional()
  @IsEnum(AsrVendors)
  asrVendor?: AsrVendors;

  @ApiProperty({ type: String, required: false, example: 'en-Us' })
  @IsOptional()
  @IsString()
  asrLanguage?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  videoLanguage?: string;

  @ApiProperty({ type: URL, required: false })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  sourceMode: 'video' | 'live';

  @Transform(({ value }) => value.split(','))
  @ApiProperty({ type: [String], required: false, example: ['en', 'de'] })
  @IsArray()
  @IsOptional()
  subtitleLanguages?: string[];
}
