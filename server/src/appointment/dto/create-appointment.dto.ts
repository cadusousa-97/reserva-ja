import { IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
    description: 'ID do funcionario que executará o atendimento',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: '4a0b4701-fd2c-49f2-a28d-54ef9aaec64c',
    description: 'ID do serviço agendado',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: '2026-03-30T14:30:00.000Z',
    description: 'Data e horário do agendamento em formato ISO 8601',
  })
  @IsDateString()
  appointmentDate: string;
}
