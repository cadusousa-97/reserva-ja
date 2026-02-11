import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import type { EmployeeRole } from '@prisma/client';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { CompanyJwtPayload } from './interfaces/companyJwtPayload.interface';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    userId: string,
    familyId?: string,
    employeeContext?: { companyId: string; role: EmployeeRole },
  ): Promise<string> {
    const tokenValue = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: tokenValue,
        userId,
        familyId: familyId || randomUUID(),
        companyId: employeeContext?.companyId,
        role: employeeContext?.role,
        expiresAt,
      },
    });

    return tokenValue;
  }

  async refresh(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Token revogado.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    if (storedToken.isUsed) {
      await this.revokeFamily(storedToken.familyId);
      throw new UnauthorizedException(
        'Detectamos uso indevido do token. Todas as sessões foram encerradas.',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isUsed: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: {
        employeeProfiles: {
          include: { company: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    let payload: JwtPayload | CompanyJwtPayload;

    if (storedToken.companyId && storedToken.role) {
      payload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        companyId: storedToken.companyId,
        role: storedToken.role,
      };
    } else {
      payload = {
        sub: user.id,
        name: user.name,
        email: user.email,
      };
    }

    const newRefreshToken = await this.create(
      user.id,
      storedToken.familyId,
      storedToken.companyId && storedToken.role
        ? { companyId: storedToken.companyId, role: storedToken.role }
        : undefined,
    );

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: newRefreshToken,
    };
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async cleanupExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
