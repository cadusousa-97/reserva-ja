import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateScheduleExceptionDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
