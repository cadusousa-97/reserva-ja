import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterEmployeeDto {
  @ApiProperty({ example: 'colaborador@empresa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Joao Silva' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '5511988887777',
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
