import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto, { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import type { EmployeeRole, Token } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { UserPayload } from './interfaces/userPayload.interface';
import { SignUpDto } from './dto/sign-up.dto';
import { MailService } from 'src/mail/mail.service';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { CompanyJwtPayload } from './interfaces/companyJwtPayload.interface';
import { RefreshTokenService } from './refresh-token.service';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async registerUser(signUpDto: SignUpDto) {
    const { email, name, phone } = signUpDto;

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

    return user;
  }

  async registerEmployee(
    registerEmployeeDto: RegisterEmployeeDto,
    token: string,
  ) {
    const now = new Date();

    const invitation = await this.prisma.employeeInvitation.findFirst({
      where: {
        email: registerEmployeeDto.email,
        token,
        status: 'PENDING',
        expiresAt: {
          gte: now,
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado ou inválido.');
    }

    const user = await this.registerUser({
      email: registerEmployeeDto.email,
      name: registerEmployeeDto.name,
      phone: registerEmployeeDto.phone,
    });

    await this.prisma.$transaction([
      this.prisma.employee.create({
        data: {
          userId: user.id,
          companyId: invitation.companyId,
          role: invitation.role,
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
      template: 'sendToken',
      context: {
        token: tokenString,
      },
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

    const refreshToken = await this.refreshTokenService.create(user.id);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
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

    const refreshToken = await this.refreshTokenService.create(
      employeeOfThisCompany.user!.id,
      undefined,
      { companyId, role: employeeOfThisCompany.role },
    );

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
    };
  }

  async sendEmployeeInvitation(
    email: string,
    companyId: string,
    role: EmployeeRole | undefined,
  ) {
    const employeeInvitationPending =
      await this.prisma.employeeInvitation.findFirst({
        where: {
          email,
          companyId,
          status: 'PENDING',
          expiresAt: {
            gte: new Date(),
          },
        },
      });

    if (employeeInvitationPending) {
      return new ConflictException('Convite já enviado para este e-mail.');
    }

    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const now = new Date();
    const expirationDays = 7;
    const expirationDate = new Date(
      now.setDate(now.getDate() + expirationDays),
    );

    const token = randomUUID();

    await this.prisma.employeeInvitation.create({
      data: {
        email,
        companyId,
        role,
        expiresAt: expirationDate,
        token,
      },
    });

    const mail = {
      to: email,
      subject: 'Reserva Já: Convite para colaborar',
      template: 'inviteEmployee',
      context: {
        companyName: company.name,
        token: token,
      },
    };

    await this.mailService.sendMail(mail);
  }
}
