import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleBlockDto {
  @ApiProperty({ example: 1, minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: '09:00',
    description: 'Hora inicial no formato HH:mm',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    example: '18:00',
    description: 'Hora final no formato HH:mm',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime: string;
}

export class SetWeeklyScheduleDto {
  @ApiProperty({
    example: '8ab4e95f-cb0f-4b63-a15f-2a2c17c3ca0a',
    description: 'ID do funcionario',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    type: [ScheduleBlockDto],
    description: 'Blocos da agenda semanal',
  })
  @ValidateNested({ each: true })
  @Type(() => ScheduleBlockDto)
  @ArrayMinSize(1)
  blocks: ScheduleBlockDto[];
}
