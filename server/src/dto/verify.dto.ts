import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  email: string;
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyResponseDto {
  @IsUUID()
  id: string;
  @IsString()
  name: string;
  @IsEmail()
  email: string;
}
