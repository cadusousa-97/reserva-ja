import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwtPayload.interface';
import type { CompanyJwtPayload } from '../interfaces/companyJwtPayload.interface';

type AuthenticatedRequest = Request & {
  user?: JwtPayload | CompanyJwtPayload;
};

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
