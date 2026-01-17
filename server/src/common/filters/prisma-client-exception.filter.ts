import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    interface ResponseData {
      status: number;
      message: string;
      error: string;
    }

    type ResponseOptions = Record<string, ResponseData>;

    const exceptionResponses: ResponseOptions = {
      P2002: {
        status: 409,
        message: `Entrada duplicada para o campo: ${exception.meta?.target}`,
        error: 'Conflict',
      },
    };

    const responseConfig = exceptionResponses[exception.code] || {
      status: 500,
      message: 'Erro interno do servidor.',
      error: 'Internal Server Error',
    };

    response.status(responseConfig.status).json(responseConfig);
  }
}
