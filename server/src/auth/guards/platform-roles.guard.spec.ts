import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRolesGuard } from './platform-roles.guard';
import { PlatformRole } from '@prisma/client';

describe('PlatformRolesGuard', () => {
  let guard: PlatformRolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new PlatformRolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext);
    expect(result).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([PlatformRole.ADMIN]);
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { platformRole: PlatformRole.USER },
        }),
      }),
    };
    const result = guard.canActivate(
      mockContext as unknown as ExecutionContext,
    );
    expect(result).toBe(false);
  });

  it('should allow access if user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([PlatformRole.ADMIN]);
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { platformRole: PlatformRole.ADMIN },
        }),
      }),
    };
    const result = guard.canActivate(
      mockContext as unknown as ExecutionContext,
    );
    expect(result).toBe(true);
  });
});
