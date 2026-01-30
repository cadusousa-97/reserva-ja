import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
