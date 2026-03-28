import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
    description: 'Novo ID do funcionario para remarcação',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    example: '2026-03-30T14:30:00.000Z',
    description: 'Nova data e horário do agendamento em formato ISO 8601',
  })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;
}
