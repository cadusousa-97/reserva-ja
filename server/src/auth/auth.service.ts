import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';
import * as argon2 from 'argon2';
import type { Token } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { UserPayload } from './interfaces/userPayload.interface';
import { SignUpDto } from './dto/sign-up.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(signUpDto: SignUpDto) {
    const { email, name, phone } = signUpDto;
    const now = new Date();

    let user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email,
          name: name,
          phone: phone,
        },
      });
    }

    const invitation = await this.prisma.employeeInvitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: {
          gte: now,
        },
      },
    });

    if (invitation) {
      await this.prisma.$transaction([
        this.prisma.employee.create({
          data: {
            userId: user.id,
            companyId: invitation.companyId,
          },
        }),
        this.prisma.employeeInvitation.update({
          data: {
            status: 'ACCEPTED',
          },
          where: {
            id: invitation.id,
          },
        }),
      ]);
    }

    await this.sendToken(email);
  }

  async sendToken(email: string) {
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

    const mail = {
      to: email,
      subject: 'Reserva Já: Código de acesso',
      text: tokenString,
    };

    await this.mailService.sendMail(mail);
  }

  async verifyToken(email: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        employeeProfiles: {
          include: {
            company: true,
          },
        },
        customerProfiles: true,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

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

    const isUserEmployee = user.employeeProfiles[0] ? true : false;

    const companiesData = user.employeeProfiles.map((profile) => {
      return {
        id: profile.company.id,
        name: profile.company.name,
      };
    });

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };

    const userPayload: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmployee: isUserEmployee,
      companies: companiesData,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      userPayload,
    };
  }

  async verifyCompany(companyId: string, userId: string) {
    const employeeOfThisCompany = await this.prisma.employee.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
      },
      include: {
        user: true,
      },
    });

    if (!employeeOfThisCompany) {
      throw new UnauthorizedException(
        'Usuário não é funcionário da empresa selecionada.',
      );
    }

    const payload = {
      sub: employeeOfThisCompany.user?.id,
      name: employeeOfThisCompany.user?.name,
      email: employeeOfThisCompany.user?.email,
      companyId: employeeOfThisCompany.companyId,
      role: employeeOfThisCompany.role,
    };

    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
