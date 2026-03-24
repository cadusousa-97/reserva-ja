import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'ana@empresa.com',
    description: 'E-mail do usuario para envio do token de login',
  })
  @IsEmail()
  email: string;
}
