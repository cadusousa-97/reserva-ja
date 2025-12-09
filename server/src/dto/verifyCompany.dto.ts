import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyCompanyDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
