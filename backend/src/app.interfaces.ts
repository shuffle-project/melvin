import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Environment, RegistrationMode } from './config/config.interface';
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
  @ApiProperty({ example: 'Melvin' })
  fullName: string;

  @IsEnum(TranslateVendors)
  @ApiProperty({
    enum: TranslateVendors,
    example: TranslateVendors.MELVIN,
  })
  translateVendor: TranslateVendors;

  @ApiProperty({ type: [LanguageShort] })
  languages: LanguageShort[];
}

export class AsrServiceConfig {
  @ApiProperty({ example: 'WhisperAI' })
  fullName: string;

  @IsEnum(AsrVendors)
  @ApiProperty({ enum: AsrVendors, example: AsrVendors.WHISPER })
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

  @ApiProperty()
  @IsEnum(RegistrationMode)
  registrationMode: RegistrationMode;
}
