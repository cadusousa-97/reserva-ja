import { ConflictException, HttpException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let prisma: {
    idempotencyKey: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const makePrismaClientKnownRequestError = (code: string) =>
    new PrismaClientKnownRequestError('err', {
      code,
      clientVersion: '6.19.0',
    });

  beforeEach(() => {
    prisma = {
      idempotencyKey: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new IdempotencyService(prisma as unknown as PrismaService);
  });

  it('execute() should require non-empty key', async () => {
    await expect(
      service.execute({
        scope: 'POST:/appointment:user:user-1',
        key: '   ',
        payload: { employeeId: 'emp-1' },
        run: async () => ({ statusCode: 200, body: { id: 'apt-1' } }),
      }),
    ).rejects.toThrow('Idempotency-Key');
  });

  it('execute() should persist success and return operation response', async () => {
    prisma.idempotencyKey.create.mockResolvedValueOnce({ id: 'idem-1' });
    prisma.idempotencyKey.update.mockResolvedValueOnce({});

    const response = await service.execute({
      scope: 'POST:/appointment:user:user-1',
      key: '9f73959e-9cd6-4978-ab6d-9c2fcf91ea88',
      payload: { employeeId: 'emp-1' },
      run: async () => ({ statusCode: 200, body: { id: 'apt-1' } }),
    });

    expect(response).toEqual({ statusCode: 200, body: { id: 'apt-1' } });
    expect(prisma.idempotencyKey.create).toHaveBeenCalledTimes(1);
    expect(prisma.idempotencyKey.update).toHaveBeenCalledWith({
      where: { id: 'idem-1' },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        responseStatusCode: 200,
      }),
    });
  });

  it('execute() should replay stored response when key already succeeded', async () => {
    prisma.idempotencyKey.create.mockRejectedValueOnce(
      makePrismaClientKnownRequestError('P2002'),
    );
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: 'idem-1',
      requestHash: 'hash-1',
      status: 'SUCCEEDED',
      responseStatusCode: 200,
      responseBody: { id: 'apt-1' },
    });

    jest.spyOn(service as any, 'buildRequestHash').mockReturnValue('hash-1');

    const run = jest.fn(async () => ({
      statusCode: 200,
      body: { id: 'apt-2' },
    }));

    const response = await service.execute({
      scope: 'POST:/appointment:user:user-1',
      key: 'same-key',
      payload: { employeeId: 'emp-1' },
      run,
    });

    expect(response).toEqual({ statusCode: 200, body: { id: 'apt-1' } });
    expect(run).not.toHaveBeenCalled();
  });

  it('execute() should throw conflict when same key is still processing', async () => {
    prisma.idempotencyKey.create.mockRejectedValueOnce(
      makePrismaClientKnownRequestError('P2002'),
    );
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: 'idem-1',
      requestHash: 'hash-1',
      status: 'PROCESSING',
      responseStatusCode: null,
      responseBody: null,
    });
    jest.spyOn(service as any, 'buildRequestHash').mockReturnValue('hash-1');

    await expect(
      service.execute({
        scope: 'POST:/appointment:user:user-1',
        key: 'same-key',
        payload: { employeeId: 'emp-1' },
        run: async () => ({ statusCode: 200, body: { id: 'apt-1' } }),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('execute() should throw conflict when payload hash differs for same key', async () => {
    prisma.idempotencyKey.create.mockRejectedValueOnce(
      makePrismaClientKnownRequestError('P2002'),
    );
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: 'idem-1',
      requestHash: 'hash-1',
      status: 'SUCCEEDED',
      responseStatusCode: 200,
      responseBody: { id: 'apt-1' },
    });
    jest.spyOn(service as any, 'buildRequestHash').mockReturnValue('hash-2');

    await expect(
      service.execute({
        scope: 'POST:/appointment:user:user-1',
        key: 'same-key',
        payload: { employeeId: 'emp-1' },
        run: async () => ({ statusCode: 200, body: { id: 'apt-2' } }),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('execute() should persist failure and replay it for same key', async () => {
    prisma.idempotencyKey.create.mockResolvedValueOnce({ id: 'idem-1' });
    prisma.idempotencyKey.update.mockResolvedValueOnce({});

    await expect(
      service.execute({
        scope: 'POST:/appointment:user:user-1',
        key: 'same-key',
        payload: { employeeId: 'emp-1' },
        run: async () => {
          throw new ConflictException('Horario indisponivel.');
        },
      }),
    ).rejects.toThrow(ConflictException);

    prisma.idempotencyKey.create.mockRejectedValueOnce(
      makePrismaClientKnownRequestError('P2002'),
    );
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: 'idem-1',
      requestHash: 'hash-1',
      status: 'FAILED',
      responseStatusCode: 409,
      responseBody: { message: 'Horario indisponivel.' },
    });
    jest.spyOn(service as any, 'buildRequestHash').mockReturnValue('hash-1');

    await expect(
      service.execute({
        scope: 'POST:/appointment:user:user-1',
        key: 'same-key',
        payload: { employeeId: 'emp-1' },
        run: async () => ({ statusCode: 200, body: { id: 'apt-1' } }),
      }),
    ).rejects.toThrow(HttpException);
  });
});
