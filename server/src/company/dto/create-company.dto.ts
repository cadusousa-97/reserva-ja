import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateAddress } from './create-address.dto';

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
  @IsNotEmpty()
  @IsString()
  name: string;
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
