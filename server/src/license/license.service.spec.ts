import { Test, TestingModule } from '@nestjs/testing';
import { LicenseService } from './license.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { LicenseStatus } from '@prisma/client';

describe('LicenseService', () => {
  let service: LicenseService;
  let prisma: PrismaService;

  const mockLicense = {
    id: '123',
    key: 'RJ-2026-ABCDEF',
    planId: 'plan-1',
    status: LicenseStatus.ACTIVE,
    ownerEmail: 'test@test.com',
    expiresAt: new Date(),
    plan: { id: 'plan-1', name: 'Basic' },
    companies: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseService,
        {
          provide: PrismaService,
          useValue: {
            license: {
              create: jest.fn().mockResolvedValue(mockLicense),
              findMany: jest.fn().mockResolvedValue([mockLicense]),
              findUnique: jest.fn().mockResolvedValue(mockLicense),
              update: jest.fn().mockResolvedValue({
                ...mockLicense,
                status: LicenseStatus.REVOKED,
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LicenseService>(LicenseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should create a new license', async () => {
    const dto = {
      planId: 'plan-1',
      ownerEmail: 'test@test.com',
      expiresAt: '2026-12-31T23:59:59.000Z',
    };
    const result = await service.create(dto);
    expect(prisma.license.create).toHaveBeenCalled();
    expect(result).toEqual(mockLicense);
  });

  it('findAll() should return licenses', async () => {
    const result = await service.findAll();
    expect(prisma.license.findMany).toHaveBeenCalled();
    expect(result).toEqual([mockLicense]);
  });

  it('findByKey() should return a license', async () => {
    const result = await service.findByKey('RJ-2026-ABCDEF');
    expect(prisma.license.findUnique).toHaveBeenCalledWith({
      where: { key: 'RJ-2026-ABCDEF' },
      include: { plan: true, companies: true },
    });
    expect(result).toEqual(mockLicense);
  });

  it('findByKey() should throw NotFound if not found', async () => {
    jest.spyOn(prisma.license, 'findUnique').mockResolvedValue(null);
    await expect(service.findByKey('MISSING')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('revoke() should update license status to REVOKED', async () => {
    const result = await service.revoke('123');
    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { status: LicenseStatus.REVOKED },
    });
    expect(result.status).toBe(LicenseStatus.REVOKED);
  });
});
