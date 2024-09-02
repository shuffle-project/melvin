import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Environment } from './config/config.interface';
import {
  AsrVendors,
  TranslateVendors,
} from './processors/processor.interfaces';

export class Hello {
  @ApiProperty({ enum: Environment })
  environment: Environment;
}

export class Language {
  @ApiProperty({ example: 'en' })
  code: string;

  @ApiProperty({ example: 'English' })
  englishName: string;

  @ApiProperty({ example: 'Englisch' })
  germanName: string;
}

export class LanguageShort {
  @ApiProperty({ example: 'en' })
  code: string;

  @ApiProperty({ example: 'English' })
  name: string;
}

export class TranslationServiceConfig {
  @ApiProperty({ example: 'LibreTranslate' })
  fullName: string;

  @IsEnum(TranslateVendors)
  @ApiProperty({
    enum: TranslateVendors,
    example: TranslateVendors.LIBRE,
  })
  translateVendor: TranslateVendors;

  @ApiProperty({ type: [LanguageShort] })
  languages: LanguageShort[];
}

export class AsrServiceConfig {
  @ApiProperty({ example: 'AssemblyAi' })
  fullName: string;

  @IsEnum(AsrVendors)
  @ApiProperty({ enum: AsrVendors, example: AsrVendors.ASSEMBLYAI })
  asrVendor: AsrVendors;

  @ApiProperty({ type: [LanguageShort] })
  languages: LanguageShort[];
}

export class ConfigEntity {
  @ApiProperty({ type: [TranslationServiceConfig] })
  translationServices: TranslationServiceConfig[];

  @ApiProperty({ type: [AsrServiceConfig] })
  asrServices: AsrServiceConfig[];

  @ApiProperty({ type: [Language] })
  languages: Language[];
}
