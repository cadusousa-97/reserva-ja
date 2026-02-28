import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { randomBytes } from 'crypto';
import { LicenseStatus } from '@prisma/client';

@Injectable()
export class LicenseService {
  constructor(private prisma: PrismaService) {}

  async create(createLicenseDto: CreateLicenseDto) {
    const year = new Date().getFullYear();
    const randomChars = randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const key = `RJ-${year}-${randomChars}`;

    return this.prisma.license.create({
      data: {
        key,
        planId: createLicenseDto.planId,
        ownerEmail: createLicenseDto.ownerEmail,
        expiresAt: new Date(createLicenseDto.expiresAt),
        status: LicenseStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });
  }

  async findAll() {
    return this.prisma.license.findMany({
      include: {
        plan: true,
        companies: true,
        ownerUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByKey(key: string) {
    const license = await this.prisma.license.findUnique({
      where: { key },
      include: {
        plan: true,
        companies: true,
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async revoke(id: string) {
    return this.prisma.license.update({
      where: { id },
      data: {
        status: LicenseStatus.REVOKED,
      },
    });
  }
}
