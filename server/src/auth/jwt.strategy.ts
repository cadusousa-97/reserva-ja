import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import type { CompanyJwtPayload } from './interfaces/companyJwtPayload.interface';

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

  async validate(
    payload: JwtPayload | CompanyJwtPayload,
  ): Promise<JwtPayload | CompanyJwtPayload> {
    // Preserve additional claims (e.g. companyId/role) for company-scoped endpoints.
    return payload;
  }
}
