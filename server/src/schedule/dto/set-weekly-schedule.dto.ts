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

export class ScheduleBlockDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime: string;
}

export class SetWeeklyScheduleDto {
  @IsUUID()
  employeeId: string;

  @ValidateNested({ each: true })
  @Type(() => ScheduleBlockDto)
  @ArrayMinSize(1)
  blocks: ScheduleBlockDto[];
}
