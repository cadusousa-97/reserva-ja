import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsNotEmpty()
  @IsString()
  expiresAt: string;
}
