import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { EmployeeRole, LicenseStatus } from '@prisma/client';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async activate(dto: ActivateLicenseDto) {
    const license = await this.prisma.license.findUnique({
      where: { key: dto.licenseKey },
      include: {
        plan: true,
        companies: true,
      },
    });

    if (!license) {
      throw new NotFoundException('Licença não encontrada');
    }

    if (license.status !== LicenseStatus.ACTIVE) {
      throw new BadRequestException('A licença não está ativa');
    }

    if (new Date() > license.expiresAt) {
      throw new BadRequestException('A licença expirou');
    }

    if (license.companies.length >= license.plan.maxCompanies) {
      throw new BadRequestException(
        'A licença atingiu o número máximo de empresas',
      );
    }

    const user = await this.authService.registerUser({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
    });

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          cpfCnpj: dto.cpfCnpj,
          companyType: dto.companyType,
          licenseId: license.id,
          addresses: {
            create: {
              ...dto.address,
            },
          },
        },
      });

      await tx.employee.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: EmployeeRole.OWNER,
        },
      });

      const isFirstActivation = license.companies.length === 0;

      if (isFirstActivation) {
        await tx.license.update({
          where: { id: license.id },
          data: {
            ownerUserId: user.id,
            activatedAt: new Date(),
          },
        });
      }

      return company;
    });
  }
}
