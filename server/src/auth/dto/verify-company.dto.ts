import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyCompanyDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
