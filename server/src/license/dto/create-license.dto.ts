import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLicenseDto {
  @ApiProperty({
    example: 'd134f5bc-7826-4de8-b90b-1e7cc73b5637',
    description: 'ID do plano da licenca',
  })
  @IsNotEmpty()
  @IsUUID()
  planId: string;

  @ApiProperty({
    required: false,
    example: 'owner@empresa.com',
    description: 'E-mail do proprietario da licenca',
  })
  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Data de expiracao da licenca',
  })
  @IsNotEmpty()
  @IsString()
  expiresAt: string;
}
