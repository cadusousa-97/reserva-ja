import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CompanyType } from '@prisma/client';
import { CreateAddress } from '../../company/dto/create-address.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLicenseDto {
  @ApiProperty({ example: 'ABC-123-XYZ', description: 'Chave de ativacao' })
  @IsNotEmpty()
  @IsString()
  licenseKey: string;

  @ApiProperty({ example: 'Ana Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ana@empresa.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '5511999999999',
    description: 'Telefone com apenas numeros (sem +, espacos ou mascara)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'phone deve conter apenas numeros.',
  })
  @Length(10, 15, {
    message: 'phone deve ter entre 10 e 15 digitos.',
  })
  phone: string;

  @ApiProperty({ example: 'Clinica Vida' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    example: '12345678000195',
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
  })
  @IsNotEmpty()
  @IsEnum(CompanyType)
  companyType: CompanyType;

  @ApiProperty({
    type: CreateAddress,
  })
  @ValidateNested()
  @Type(() => CreateAddress)
  address: CreateAddress;
}
