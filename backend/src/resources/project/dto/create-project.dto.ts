import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { Project } from '../../../modules/db/schemas/project.schema';
import { AsrVendors } from '../../../processors/processor.interfaces';

class VideoOption {
  @ApiProperty({ type: String, required: true })
  category: string;

  @ApiProperty({ type: Boolean, required: true })
  useAudio: boolean;
}

class SubtitleOption {
  @ApiProperty({ type: String, required: true })
  language: string;
}

export class CreateProjectDto extends PickType(Project, [
  'title',
  'language',
] as const) {
  @ApiProperty({ enum: AsrVendors, required: true })
  @IsEnum(AsrVendors)
  asrVendor: AsrVendors;

  @Transform(({ value }) => JSON.parse(value))
  @ApiProperty({
    type: [VideoOption],
    required: true,
  })
  @IsArray()
  videoOptions: { category: string; useAudio: boolean }[];

  @Transform(({ value }) => JSON.parse(value))
  @ApiProperty({
    type: [SubtitleOption],
    required: false,
  })
  @IsArray()
  @IsOptional()
  subtitleOptions?: { language: string }[];
}
