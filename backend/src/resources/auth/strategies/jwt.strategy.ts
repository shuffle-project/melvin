import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DecodedToken, MediaAccessDecodedToken } from '../auth.interfaces';

const fromAuthHeaderAsBearerToken = ExtractJwt.fromAuthHeaderAsBearerToken();
const fromUrlQueryParameter = ExtractJwt.fromUrlQueryParameter('Authorization');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) =>
        fromAuthHeaderAsBearerToken(req) || fromUrlQueryParameter(req),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(
    payload: DecodedToken | MediaAccessDecodedToken,
  ): Promise<DecodedToken | MediaAccessDecodedToken> {
    return payload;
  }
}
