import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { UserPayload } from './interfaces/user-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: jwtConstants.secret,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
    });
  }

  async validate(payload: UserPayload): Promise<UserPayload> {
    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
    };
  }
}
