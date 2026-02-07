import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmployeeRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CompanyJwtPayload } from 'src/auth/interfaces/companyJwtPayload.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.findOnePublic(id);
  }

  @Get('findAll/:companyId')
  findAll(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.serviceService.findAllByCompany(companyId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.serviceService.create(createServiceDto, user.companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.serviceService.update(id, updateServiceDto, user.companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.serviceService.remove(id, user.companyId);
  }
}
