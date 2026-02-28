import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CompanyType } from '@prisma/client';
import { CreateAddress } from '../../company/dto/create-address.dto';

export class ActivateLicenseDto {
  @IsNotEmpty()
  @IsString()
  licenseKey: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  @Length(11, 14)
  cpfCnpj: string;

  @IsNotEmpty()
  @IsEnum(CompanyType)
  companyType: CompanyType;

  @ValidateNested()
  @Type(() => CreateAddress)
  address: CreateAddress;
}
