import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transcription } from '../../../modules/db/schemas/transcription.schema';
import {
  AsrVendors,
  TranslateVendors,
} from '../../../processors/processor.interfaces';

export class AsrDto {
  @ApiProperty({ enum: AsrVendors })
  @IsEnum(AsrVendors)
  @Type(() => String)
  vendor: AsrVendors;
}

export class TranslateDto {
  @ApiProperty({ enum: TranslateVendors })
  @IsEnum(TranslateVendors)
  @Type(() => String)
  vendor: TranslateVendors;

  @ApiProperty()
  @IsMongoId()
  @Type(() => String)
  sourceTranscriptionId: string;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  targetLanguage: string;
}

export class CopyDto {
  @ApiProperty()
  @IsMongoId()
  @Type(() => String)
  sourceTranscriptionId: string;
}

export class CreateTranscriptionDto extends PickType(Transcription, [
  'project',
  'title',
  'language',
] as const) {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AsrDto)
  asrDto?: AsrDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TranslateDto)
  translateDto?: TranslateDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CopyDto)
  copyDto?: CopyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  uploadId?: string;
}
