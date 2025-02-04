import {
  IsArray,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum Environment {
  LOCAL = 'local',
  DEV = 'dev',
  DOCKER = 'docker',
  TEST = 'test',
}

export class MongodbConfig {
  @IsString()
  uri: string;
}

export class RedisConfig {
  @IsString()
  host: string;

  @IsNumber()
  port: number;
}

export class JwtConfig {
  @IsString()
  secret: string;

  @IsString()
  audience: string;

  @IsString()
  issuer: string;
}

export class BasicAuthConfig {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class EmailConfig {
  @IsString()
  smtpServer: string;

  @IsInt()
  smtpPort: number;

  @IsString()
  user: string;

  @IsString()
  password: string;

  @IsEmail()
  mailFrom: string;

  @IsString()
  mailFromName: string;
}

export class DeepLConfig {
  @IsString()
  @IsDefined()
  url: string;

  @IsString()
  @IsDefined()
  apikey: string;
}

export class LibreTranslateConfig {
  @IsString()
  @IsDefined()
  url: string;
}

export class GoogleTranslateConfig {
  @IsString()
  @IsDefined()
  url: string;

  @IsString()
  @IsDefined()
  apikey: string;
}

export class AssmeblyAiConfig {
  @IsString()
  @IsDefined()
  url: string;

  @IsString()
  @IsDefined()
  apikey: string;
}

export class GoogleSpeechConfig {
  @IsString()
  @IsDefined()
  bucketName: string;

  @IsString()
  @IsDefined()
  project_id: string;

  @IsString()
  @IsDefined()
  private_key: string;

  @IsString()
  @IsDefined()
  client_email: string;
}

export class WhisperConfig {
  @IsString()
  @IsDefined()
  host: string;

  @IsString()
  @IsDefined()
  apikey: string;
}

export class LivekitConfig {
  @IsString()
  @IsDefined()
  url: string;

  @IsString()
  @IsDefined()
  apikey: string;

  @IsString()
  @IsDefined()
  secret: string;
}

export class PopulateUser {
  @IsString()
  name: string;
  @IsDefined()
  email: string;
}

export class Config {
  @IsEnum(Environment)
  environment: Environment;

  @IsString()
  @IsDefined()
  baseUrl: string;

  @ValidateNested({ each: true })
  @IsDefined()
  mongodb: MongodbConfig;

  @ValidateNested({ each: true })
  @IsOptional()
  redis: RedisConfig;

  @ValidateNested({ each: true })
  @IsDefined()
  jwt: JwtConfig;

  @ValidateNested({ each: true })
  @IsDefined()
  basicAuth: BasicAuthConfig;

  @ValidateNested({ each: true })
  @IsDefined()
  email: EmailConfig;

  @IsArray()
  @ValidateNested({ each: true })
  @IsDefined()
  initialUsers: PopulateUser[];

  @ValidateNested({ each: true })
  deepL: DeepLConfig;

  @ValidateNested({ each: true })
  libreTranslate: LibreTranslateConfig;

  @ValidateNested({ each: true })
  googleTranslate: GoogleTranslateConfig;

  @ValidateNested({ each: true })
  assemblyAi: AssmeblyAiConfig;

  @ValidateNested({ each: true })
  googleSpeech: GoogleSpeechConfig;

  @ValidateNested({ each: true })
  whisper: WhisperConfig;

  @ValidateNested({ each: true })
  livekit: LivekitConfig;
}
