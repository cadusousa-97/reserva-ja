import { ApiProperty } from '@nestjs/swagger';

export class ApiBooleanSuccessResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica se a operacao foi concluida com sucesso',
  })
  success: boolean;
}

export class ApiMessageResponseDto {
  @ApiProperty({
    example: 'Operacao realizada com sucesso.',
    description: 'Mensagem de retorno',
  })
  message: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'Codigo HTTP da resposta de erro',
  })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Refresh token nao encontrado.' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email must be an email'],
      },
    ],
    description: 'Mensagem de erro da API',
  })
  message: string | string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'Tipo/categoria do erro',
  })
  error: string;
}
