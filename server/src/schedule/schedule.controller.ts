import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { SetWeeklyScheduleDto } from './dto/set-weekly-schedule.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CompanyJwtPayload } from '../auth/interfaces/companyJwtPayload.interface';
import { EmployeeRole } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-response.dto';

@Controller('schedule')
@ApiTags('Schedule')
@ApiBearerAuth('bearer')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @ApiOperation({
    summary: 'Define blocos da agenda semanal de um funcionario',
  })
  @ApiBody({ type: SetWeeklyScheduleDto })
  @ApiOkResponse({ description: 'Agenda semanal definida com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para agenda semanal.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
  @Put('weekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER, EmployeeRole.REGULAR)
  setWeeklySchedule(
    @Body() dto: SetWeeklyScheduleDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.setWeeklySchedule(dto, user.companyId);
  }

  @ApiOperation({ summary: 'Consulta agenda semanal de um funcionario' })
  @ApiParam({
    name: 'employeeId',
    description: 'ID UUID do funcionario',
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
  })
  @ApiOkResponse({ description: 'Agenda semanal retornada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID do funcionario invalido.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
  @Get('weekly/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  getWeeklySchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.getWeeklySchedule(employeeId, user.companyId);
  }

  @ApiOperation({ summary: 'Cria excecao de agenda para uma data especifica' })
  @ApiBody({ type: CreateScheduleExceptionDto })
  @ApiOkResponse({ description: 'Excecao criada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao da excecao.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
  @Post('exception')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  createException(
    @Body() dto: CreateScheduleExceptionDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.createException(dto, user.companyId);
  }

  @ApiOperation({ summary: 'Remove uma excecao de agenda' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID da excecao',
    example: 'f2fba011-146c-4534-9e76-42fb4fda3d2a',
  })
  @ApiOkResponse({ description: 'Excecao removida com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado ou sem permissao.',
    type: ApiErrorResponseDto,
  })
  @Delete('exception/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  deleteException(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.deleteException(id, user.companyId);
  }

  @ApiOperation({ summary: 'Consulta horarios disponiveis para um servico' })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-03-30',
    description: 'Data da consulta em formato YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'serviceId',
    required: true,
    example: '4a0b4701-fd2c-49f2-a28d-54ef9aaec64c',
  })
  @ApiOkResponse({
    description: 'Horarios disponiveis retornados com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Parametros de consulta invalidos.',
    type: ApiErrorResponseDto,
  })
  @Get('available-slots')
  getAvailableSlots(
    @Query('employeeId') employeeId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.scheduleService.getAvailableSlots(employeeId, date, serviceId);
  }
}
