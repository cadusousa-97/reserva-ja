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
import { ApiErrorResponseDto } from 'src/common/swagger/dto/api-response.dto';
@Controller('service')
@ApiTags('Services')
@ApiBearerAuth('bearer')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @ApiOperation({ summary: 'Busca um servico pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do servico',
    example: '4a0b4701-fd2c-49f2-a28d-54ef9aaec64c',
  })
  @ApiOkResponse({ description: 'Servico encontrado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.findOnePublic(id);
  }

  @ApiOperation({ summary: 'Lista todos os servicos ativos de uma empresa' })
  @ApiParam({
    name: 'companyId',
    description: 'ID UUID da empresa',
    example: 'a3f5e34f-45f1-4cf7-9f1c-b5a8d3d2f1b0',
  })
  @ApiOkResponse({ description: 'Lista de servicos retornada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID da empresa invalido.',
    type: ApiErrorResponseDto,
  })
  @Get('findAll/:companyId')
  findAll(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.serviceService.findAllByCompany(companyId);
  }

  @ApiOperation({ summary: 'Cria um novo servico para a empresa autenticada' })
  @ApiBody({ type: CreateServiceDto })
  @ApiOkResponse({ description: 'Servico criado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao do servico.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.serviceService.create(createServiceDto, user.companyId);
  }

  @ApiOperation({ summary: 'Atualiza um servico existente da empresa autenticada' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do servico',
    example: '4a0b4701-fd2c-49f2-a28d-54ef9aaec64c',
  })
  @ApiBody({ type: UpdateServiceDto })
  @ApiOkResponse({ description: 'Servico atualizado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos ou ID incorreto.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({ summary: 'Remove um servico da empresa autenticada' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do servico',
    example: '4a0b4701-fd2c-49f2-a28d-54ef9aaec64c',
  })
  @ApiOkResponse({ description: 'Servico removido com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
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
