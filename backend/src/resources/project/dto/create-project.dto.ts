import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Project } from '../../../modules/db/schemas/project.schema';
import { AsrVendors } from '../../../processors/processor.interfaces';

class VideoOption {
  @ApiProperty({ type: String, required: true })
  uploadId: string;

  @ApiProperty({ type: String, required: true })
  category: string;

  @ApiProperty({ type: Boolean, required: true })
  useAudio: boolean;
}

class SubtitleOption {
  @ApiProperty({ type: String, required: true })
  uploadId: string;

  @ApiProperty({ type: String, required: true })
  language: string;
}

export class CreateLiveProjectDto extends PickType(Project, [
  'title',
  'language',
] as const) {}

export class CreateProjectDto extends PickType(Project, [
  'title',
  'language',
] as const) {
  @ApiProperty({ enum: AsrVendors, required: true })
  @IsEnum(AsrVendors)
  asrVendor: AsrVendors;

  @ApiProperty({
    type: [VideoOption],
    required: true,
  })
  @IsArray()
  videoOptions: VideoOption[];

  @ApiProperty({
    type: [SubtitleOption],
    required: false,
  })
  @IsArray()
  @IsOptional()
  subtitleOptions?: SubtitleOption[];

  @ApiProperty({ type: Boolean, required: false, default: false })
  @IsBoolean()
  @IsOptional()
  recorder?: boolean = false;
}
