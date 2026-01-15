import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class CompanySummaryDto {
  @IsUUID()
  id: string;
  @IsString()
  name: string;
}

export class VerifyDto {
  @IsEmail()
  email: string;
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyResponseDto {
  @IsUUID()
  id: string;
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsBoolean()
  isEmployee: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompanySummaryDto)
  companies?: CompanySummaryDto[];
}
