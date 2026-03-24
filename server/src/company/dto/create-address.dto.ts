import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddress {
  @ApiProperty({ example: 'Rua das Flores', description: 'Nome da rua' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: '123', description: 'Numero do endereco' })
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty({ example: '01001000', description: 'CEP com 8 digitos' })
  @IsString()
  @Length(8, 8)
  zipCode: string;

  @ApiProperty({ example: 'Sao Paulo', description: 'Cidade' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP', description: 'UF com 2 caracteres' })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiProperty({
    required: false,
    example: 'Sala 12',
    description: 'Complemento do endereco',
  })
  @IsOptional()
  @IsString()
  complement: string;

  @ApiProperty({
    required: false,
    example: 'Proximo ao metro',
    description: 'Ponto de referencia',
  })
  @IsOptional()
  @IsString()
  landmark: string;
}
