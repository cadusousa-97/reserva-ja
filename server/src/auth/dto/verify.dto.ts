import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'a3f5e34f-45f1-4cf7-9f1c-b5a8d3d2f1b0',
    description: 'ID da empresa',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    example: 'Clinica Vida',
    description: 'Nome da empresa',
  })
  @IsString()
  name: string;
}

export class VerifyDto {
  @ApiProperty({
    example: 'ana@empresa.com',
    description: 'E-mail usado no login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Token de verificacao enviado por e-mail',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyResponseDto {
  @ApiProperty({
    example: '9d9c0f0e-2ef7-4ca8-9bd4-5f0f8f5e43e1',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    example: 'Ana Silva',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'ana@empresa.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isEmployee: boolean;

  @ApiProperty({
    required: false,
    type: [CompanySummaryDto],
    example: [
      {
        id: 'a3f5e34f-45f1-4cf7-9f1c-b5a8d3d2f1b0',
        name: 'Clinica Vida',
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompanySummaryDto)
  companies?: CompanySummaryDto[];
}
