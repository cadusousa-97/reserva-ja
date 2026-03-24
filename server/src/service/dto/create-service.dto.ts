import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Corte de cabelo',
    description: 'Nome do servico oferecido',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Corte tradicional com tesoura e maquina',
    description: 'Descricao do servico',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 45,
    description: 'Duracao do servico em minutos',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({
    example: 7000,
    description: 'Preço em centavos',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Indica se o servico esta ativo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Percentual de desconto aplicado',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
