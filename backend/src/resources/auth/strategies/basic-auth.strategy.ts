import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { BasicStrategy as Strategy } from 'passport-http';
import { BasicAuthConfig } from '../../../config/config.interface';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(Strategy) {
  private config: BasicAuthConfig;

  constructor(private configService: ConfigService) {
    super({
      passReqToCallback: true,
    });

    this.config = this.configService.get<BasicAuthConfig>('basicAuth');
  }

  public validate = async (
    req: Request,
    username: string,
    password: string,
  ): Promise<boolean> => {
    if (
      this.config.username === username &&
      this.config.password === password
    ) {
      return true;
    }
    throw new UnauthorizedException();
  };
}
