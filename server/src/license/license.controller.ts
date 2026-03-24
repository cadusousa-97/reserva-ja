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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-response.dto';

@Controller('admin/licenses')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(PlatformRole.ADMIN)
@ApiTags('Licenses')
@ApiBearerAuth('bearer')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @ApiOperation({ summary: 'Cria uma nova licenca' })
  @ApiBody({ type: CreateLicenseDto })
  @ApiOkResponse({ description: 'Licenca criada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao da licenca.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao de admin.',
    type: ApiErrorResponseDto,
  })
  @Post()
  async create(@Body() createLicenseDto: CreateLicenseDto) {
    return this.licenseService.create(createLicenseDto);
  }

  @ApiOperation({ summary: 'Lista todas as licencas' })
  @ApiOkResponse({ description: 'Lista de licencas retornada com sucesso.' })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao de admin.',
    type: ApiErrorResponseDto,
  })
  @Get()
  async findAll() {
    return this.licenseService.findAll();
  }

  @ApiOperation({ summary: 'Revoga uma licenca existente' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID da licenca',
    example: 'b8730942-7e71-4ddf-af45-8ce56aa9cf63',
  })
  @ApiOkResponse({ description: 'Licenca revogada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao de admin.',
    type: ApiErrorResponseDto,
  })
  @Patch(':id/revoke')
  async revoke(@Param('id') id: string) {
    return this.licenseService.revoke(id);
  }
}
