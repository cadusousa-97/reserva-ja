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
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwtPayload.interface';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiHeader,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-response.dto';

@Controller('appointment')
@ApiTags('Appointments')
@ApiBearerAuth('bearer')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Chave única para deduplicar retries de criação.',
  })
  @ApiOkResponse({ description: 'Agendamento criado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao do agendamento.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'Conflito de agenda ou chave idempotente em processamento/payload divergente.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario não autenticado.',
    type: ApiErrorResponseDto,
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Cabecalho Idempotency-Key é obrigatório.');
    }

    return this.appointmentService.create(
      createAppointmentDto,
      user.sub,
      idempotencyKey,
    );
  }

  @ApiOperation({ summary: 'Lista todos os agendamentos' })
  @ApiOkResponse({
    description: 'Lista de agendamentos retornada com sucesso.',
  })
  @Get()
  findAll() {
    return this.appointmentService.findAll();
  }

  @ApiOperation({ summary: 'Busca um agendamento pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do agendamento',
    example: '5f3c6a41-1d47-4efc-9a9e-f22bd62d4dad',
  })
  @ApiOkResponse({ description: 'Agendamento encontrado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualiza um agendamento existente' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do agendamento',
    example: '5f3c6a41-1d47-4efc-9a9e-f22bd62d4dad',
  })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Chave única para deduplicar retries de remarcação.',
  })
  @ApiOkResponse({ description: 'Agendamento atualizado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou ID incorreto.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Conflito de agenda ou chave idempotente em andamento.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado.',
    type: ApiErrorResponseDto,
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Cabeçalho Idempotency-Key é obrigatório.');
    }

    return this.appointmentService.update(
      id,
      updateAppointmentDto,
      user.sub,
      idempotencyKey,
    );
  }

  @ApiOperation({ summary: 'Remove um agendamento' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID do agendamento',
    example: '5f3c6a41-1d47-4efc-9a9e-f22bd62d4dad',
  })
  @ApiOkResponse({ description: 'Agendamento removido com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id);
  }
}
