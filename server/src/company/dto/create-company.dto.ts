import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateAddress } from './create-address.dto';
import { ApiProperty } from '@nestjs/swagger';

export enum CompanyType {
  BEAUTY_SALON = 'BEAUTY_SALON',
  BARBERSHOP = 'BARBERSHOP',
  SPA = 'SPA',
  CLINIC = 'CLINIC',
  NAIL_SPA = 'NAIL_SPA',
  LASH_STUDIO = 'LASH_STUDIO',
  OTHER = 'OTHER',
}

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Clinica Vida',
    description: 'Nome da empresa',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '12345678000195',
    description: 'CPF/CNPJ sem pontuacao',
    minLength: 11,
    maxLength: 14,
  })
  @IsNotEmpty()
  @IsString()
  @Length(11, 14)
  cpfCnpj: string;

  @ApiProperty({
    enum: CompanyType,
    example: CompanyType.CLINIC,
    description: 'Tipo da empresa',
  })
  @IsNotEmpty()
  @IsEnum(CompanyType)
  companyType: CompanyType;

  @ApiProperty({
    type: CreateAddress,
    description: 'Endereco principal da empresa',
  })
  @ValidateNested()
  @Type(() => CreateAddress)
  address: CreateAddress;
}
