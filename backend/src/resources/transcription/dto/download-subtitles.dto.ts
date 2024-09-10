import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum } from 'class-validator';

export enum SubtitleExportType {
  SRT = 'srt',
  VTT = 'vtt',
  TXT = 'txt',
}

export class DownloadSubtitlesQuery {
  @ApiProperty({ enum: SubtitleExportType })
  @IsEnum(SubtitleExportType)
  @Type(() => String)
  type: SubtitleExportType;
}
