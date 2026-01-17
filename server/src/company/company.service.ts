import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        cpfCnpj: createCompanyDto.cpfCnpj,
        companyType: createCompanyDto.companyType,
        addresses: {
          create: {
            ...createCompanyDto.address,
          },
        },
      },
    });
  }
}
