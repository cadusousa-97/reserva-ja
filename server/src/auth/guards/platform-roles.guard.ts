import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import { PlatformRole } from '@prisma/client';
import type { Request } from 'express';

type PlatformRolesRequest = Request & {
  user?: {
    platformRole?: PlatformRole;
  };
};

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<PlatformRolesRequest>();
    const userPlatformRole = user?.platformRole;

    return requiredRoles.some((role) => role === userPlatformRole);
  }
}
