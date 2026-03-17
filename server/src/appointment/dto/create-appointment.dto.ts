import { IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  appointmentDate: string;
}
