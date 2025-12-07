import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import crypto from 'crypto';
import * as argon2 from 'argon2';
import type { Token } from '@prisma/client';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const tokenString = crypto.randomInt(100000, 1000000).toString();
    const hashedToken = await argon2.hash(tokenString);
    const now = new Date();
    const expirationMinutes = 15;
    const expirationDateToken = new Date(
      now.setMinutes(now.getMinutes() + expirationMinutes),
    );

    await this.prisma.token.create({
      data: {
        userId: user?.id,
        token: hashedToken,
        expiresAt: expirationDateToken,
      },
    });
  }

  async verify(email: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    const now = new Date();

    const tokens = await this.prisma.token.findMany({
      where: {
        userId: user?.id,
        expiresAt: {
          gte: now,
        },
      },
    });

    let matchedToken: Token | null = null;

    for (const hashedToken of tokens) {
      const tokenWasMatched = await argon2.verify(hashedToken.token, token);
      if (tokenWasMatched) {
        matchedToken = hashedToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    await this.prisma.token.delete({
      where: {
        id: matchedToken?.id,
      },
    });
  }
}
