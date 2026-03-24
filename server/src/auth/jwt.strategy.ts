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
        (request: Request): string | null => {
          return (request?.cookies?.access_token as string | undefined) ?? null;
        },
      ]),
    });
  }

  validate(
    payload: JwtPayload | CompanyJwtPayload,
  ): JwtPayload | CompanyJwtPayload {
    // Preserve additional claims (e.g. companyId/role) for company-scoped endpoints.
    return payload;
  }
}
