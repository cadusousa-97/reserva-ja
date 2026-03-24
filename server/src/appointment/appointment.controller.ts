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
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-response.dto';

@Controller('appointment')
@ApiTags('Appointments')
@ApiBearerAuth('bearer')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiOkResponse({ description: 'Agendamento criado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao do agendamento.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentService.create(createAppointmentDto, user.sub);
  }

  @ApiOperation({ summary: 'Lista todos os agendamentos' })
  @ApiOkResponse({ description: 'Lista de agendamentos retornada com sucesso.' })
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
  @ApiOkResponse({ description: 'Agendamento atualizado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos ou ID incorreto.',
    type: ApiErrorResponseDto,
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(id, updateAppointmentDto);
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
