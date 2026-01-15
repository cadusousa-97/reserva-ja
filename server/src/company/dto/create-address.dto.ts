import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateAddress {
  @IsNotEmpty()
  @IsString()
  street: string;
  @IsNotEmpty()
  @IsString()
  number: string;
  @IsString()
  @Length(8, 8)
  zipCode: string;
  @IsNotEmpty()
  @IsString()
  city: string;
  @IsString()
  @Length(2, 2)
  state: string;
  @IsOptional()
  @IsString()
  complement: string;
  @IsOptional()
  @IsString()
  landmark: string;
}
