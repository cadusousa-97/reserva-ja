import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'ana@empresa.com',
    description: 'E-mail principal da conta',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Ana Silva',
    description: 'Nome do usuario responsavel pela conta',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '+55 11 99999-9999',
    description: 'Telefone de contato',
  })
  @IsNotEmpty()
  phone: string;
}
