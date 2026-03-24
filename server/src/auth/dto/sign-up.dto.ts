import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
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
    example: '5511999999999',
    description: 'Telefone com apenas numeros (sem +, espacos ou mascara)',
  })
  @IsNotEmpty()
  @Matches(/^\d+$/, {
    message: 'phone deve conter apenas numeros.',
  })
  @Length(10, 15, {
    message: 'phone deve ter entre 10 e 15 digitos.',
  })
  phone: string;
}
