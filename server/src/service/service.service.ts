import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async findAllByCompany(companyId: string) {
    return this.prisma.service.findMany({
      where: { companyId },
    });
  }

  async findOnePublic(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    return service;
  }

  async findOne(id: string, companyId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, companyId },
    });

    if (!service) {
      throw new NotFoundException(
        'Serviço não encontrado ou você não tem permissão para editar este serviço.',
      );
    }

    return service;
  }

  async create(createServiceDto: CreateServiceDto, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        company: {
          connect: { id: companyId },
        },
      },
    });
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    companyId: string,
  ) {
    await this.findOne(id, companyId);

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
