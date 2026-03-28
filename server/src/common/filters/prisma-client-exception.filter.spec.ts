import { ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

describe('PrismaClientExceptionFilter', () => {
  const makeException = (
    code: string,
    meta?: Record<string, unknown>,
  ): PrismaClientKnownRequestError =>
    new PrismaClientKnownRequestError('err', {
      code,
      clientVersion: '6.19.0',
      meta,
    });

  const makeHost = (json: jest.Mock, status: jest.Mock): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({
          status,
          json,
        }),
      }),
    }) as unknown as ArgumentsHost;

  it('should map overlap constraint P2004 to 409 conflict', () => {
    const filter = new PrismaClientExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = makeHost(json, status);

    filter.catch(
      makeException('P2004', {
        database_error:
          'constraint "appointment_no_overlap_per_employee" violated',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      status: 409,
      message: ['Horário indisponível para este funcionário.'],
      error: 'CONFLICT',
    });
  });
});
