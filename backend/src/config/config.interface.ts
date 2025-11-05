import {
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

export class AdminUserConfig {
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  hashedPassword?: string;

  @IsString()
  @IsOptional()
  password?: string;
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

export class MelvinAsrConfig {
  @IsString()
  @IsDefined()
  host: string;

  @IsString()
  @IsDefined()
  apikey: string;
}

export class PopulateUser {
  @IsString()
  name: string;
  @IsDefined()
  email: string;
}

export enum RegistrationMode {
  DISABLED = 'disabled',
  EMAIL = 'email',
}

export class RegistrationConfig {
  @IsEnum(RegistrationMode)
  mode: RegistrationMode;
}

export class Config {
  @IsEnum(Environment)
  environment: Environment;

  @ValidateNested({ each: true })
  @IsDefined()
  registration: RegistrationConfig;

  @IsNumber()
  @IsOptional()
  @IsNumber()
  defaultUserSizeLimitGB: number = -1;

  @IsString()
  baseUrl: string;

  @IsString()
  baseFrontendUrl: string;

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
  adminUser: AdminUserConfig;

  @ValidateNested({ each: true })
  @IsOptional()
  email: EmailConfig;

  @ValidateNested({ each: true })
  melvinAsr: MelvinAsrConfig;
}
