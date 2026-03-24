import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleExceptionDto {
  @ApiProperty({
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
    description: 'ID do funcionario',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: '2026-03-30',
    description: 'Data da excecao em formato ISO',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: false,
    description: 'Define se a agenda esta totalmente fechada na data',
  })
  @IsBoolean()
  isClosed: boolean;

  @ApiProperty({
    required: false,
    example: '10:00',
    description: 'Hora inicial no formato HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @ApiProperty({
    required: false,
    example: '14:00',
    description: 'Hora final no formato HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string;

  @ApiProperty({
    required: false,
    example: 'Treinamento interno',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
