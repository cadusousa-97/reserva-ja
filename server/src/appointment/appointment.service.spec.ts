import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prisma: {
    $transaction: jest.Mock;
  };
  let idempotency: {
    execute: jest.Mock;
  };

  const userId = 'user-1';
  const companyId = 'comp-1';
  const employeeId = 'emp-1';
  const serviceId = 'svc-1';
  const customerId = 'cust-1';

  const makePckre = (code: string) =>
    new PrismaClientKnownRequestError('err', {
      code,
      clientVersion: '6.19.0',
    });

  const makeCreateDto = (
    overrides: Partial<CreateAppointmentDto> = {},
  ): CreateAppointmentDto => ({
    employeeId,
    serviceId,
    appointmentDate: '2026-03-14T10:00:00.000Z',
    ...overrides,
  });

  const makeTx = (overrides?: Partial<any>) => {
    const tx = {
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: serviceId,
          isActive: true,
          companyId,
          durationMinutes: 30,
        }),
      },
      employee: {
        findUnique: jest.fn().mockResolvedValue({
          id: employeeId,
          companyId,
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({
          id: customerId,
          userId,
          companyId,
        }),
        create: jest.fn().mockResolvedValue({
          id: customerId,
          userId,
          companyId,
        }),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'apt-1',
          companyId,
          employeeId,
          serviceId,
          customerId,
          status: 'SCHEDULED',
        }),
      },
      ...overrides,
    };

    return tx;
  };

  beforeEach(async () => {
    const tx = makeTx();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest
              .fn()
              .mockImplementation((cb: any, _opts: any) => {
                return cb(tx);
              }),
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            execute: jest.fn().mockImplementation(async (params: any) => {
              return params.run();
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prisma = module.get(PrismaService);
    idempotency = module.get(IdempotencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should create appointment for a customer', async () => {
    const dto = makeCreateDto();

    const result = await service.create(dto, userId, 'idem-1');

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );

    // Validate the create payload in a way that survives refactors.
    const txUsed = prisma.$transaction.mock.calls[0][0] as Function;
    expect(typeof txUsed).toBe('function');

    // Ensure the transaction created the appointment.
    // We cannot access the inner tx directly here, but we can assert the returned object.
    expect(result).toMatchObject({
      companyId,
      employeeId,
      serviceId,
      customerId,
      status: 'SCHEDULED',
    });
    expect(idempotency.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: `POST:/appointment:user:${userId}`,
        key: 'idem-1',
      }),
    );
  });

  it('create() should create customer profile if missing', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      customer: {
        findFirst: jest.fn().mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValueOnce({
          id: customerId,
          userId,
          companyId,
        }),
      },
    });

    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    const result = await service.create(dto, userId, 'idem-1');
    expect(tx.customer.create).toHaveBeenCalledWith({
      data: { userId, companyId },
    });
    expect(tx.appointment.create).toHaveBeenCalled();
    expect(result).toMatchObject({ customerId });
  });

  it('create() should handle customer create race (P2002) by refetching', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      customer: {
        findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          id: customerId,
          userId,
          companyId,
        }),
        create: jest.fn().mockRejectedValueOnce(makePckre('P2002')),
      },
    });

    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    const result = await service.create(dto, userId, 'idem-1');
    expect(tx.customer.create).toHaveBeenCalled();
    expect(tx.customer.findFirst).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ customerId });
  });

  it('create() should throw NotFoundException when service does not exist', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      service: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    });
    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create() should throw NotFoundException when service is inactive', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: serviceId,
          isActive: false,
          companyId,
          durationMinutes: 30,
        }),
      },
    });
    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create() should throw NotFoundException when employee does not exist', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      employee: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    });
    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create() should throw ConflictException when employee/service company mismatch', async () => {
    const dto = makeCreateDto();

    const tx = makeTx({
      employee: {
        findUnique: jest.fn().mockResolvedValue({
          id: employeeId,
          companyId: 'comp-2',
        }),
      },
    });
    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('create() should throw BadRequestException for invalid appointmentDate', async () => {
    const dto = makeCreateDto({ appointmentDate: 'not-a-date' });

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create() should throw ConflictException when time overlaps existing appointment', async () => {
    const dto = makeCreateDto({ appointmentDate: '2026-03-14T10:30:00.000Z' });

    const tx = makeTx({
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: serviceId,
          isActive: true,
          companyId,
          durationMinutes: 30,
        }),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue([
          {
            appointmentDate: new Date('2026-03-14T10:00:00.000Z'),
            service: { durationMinutes: 60 },
          },
        ] as any),
        create: jest.fn(),
      },
    });

    prisma.$transaction.mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    await expect(service.create(dto, userId, 'idem-1')).rejects.toThrow(
      ConflictException,
    );
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it('create() should retry on serializable abort (P2034)', async () => {
    const dto = makeCreateDto();

    const tx = makeTx();

    prisma.$transaction
      .mockRejectedValueOnce(makePckre('P2034'))
      .mockImplementationOnce((cb: any, _opts: any) => cb(tx));

    const result = await service.create(dto, userId, 'idem-1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: 'SCHEDULED' });
  });
});
