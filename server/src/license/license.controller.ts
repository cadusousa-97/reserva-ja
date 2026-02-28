import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LicenseService } from './license.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import { PlatformRole } from '@prisma/client';

@Controller('admin/licenses')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(PlatformRole.ADMIN)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post()
  async create(@Body() createLicenseDto: CreateLicenseDto) {
    return this.licenseService.create(createLicenseDto);
  }

  @Get()
  async findAll() {
    return this.licenseService.findAll();
  }

  @Patch(':id/revoke')
  async revoke(@Param('id') id: string) {
    return this.licenseService.revoke(id);
  }
}
