import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LicenseStatus, CompanyType } from '@prisma/client';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: PrismaService;
  let authService: AuthService;

  const mockLicense = {
    id: 'license-1',
    key: 'RJ-2026-ABCDEF',
    status: LicenseStatus.ACTIVE,
    expiresAt: new Date('2030-01-01'),
    plan: { maxCompanies: 2 },
    companies: [],
  };

  const mockUser = { id: 'user-1', name: 'John Doe', email: 'john@doe.com' };
  const mockCompany = { id: 'company-1', name: 'My Co' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: {
            license: {
              findUnique: jest.fn().mockResolvedValue(mockLicense),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              const tx = {
                company: { create: jest.fn().mockResolvedValue(mockCompany) },
                employee: { create: jest.fn() },
                license: { update: jest.fn() },
              };
              return cb(tx);
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            registerUser: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
  });

  it('activate() should activate license and create company', async () => {
    const dto = {
      licenseKey: 'RJ-2026-ABCDEF',
      name: 'John Doe',
      email: 'john@doe.com',
      phone: '123456',
      companyName: 'My Co',
      cpfCnpj: '12345678901',
      companyType: CompanyType.OTHER,
      address: {
        street: 'Street',
        number: '123',
        zipCode: '12345678',
        city: 'City',
        state: 'ST',
        complement: '',
        landmark: '',
      },
    };

    const result = await service.activate(dto);

    expect(prisma.license.findUnique).toHaveBeenCalled();
    expect(authService.registerUser).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual(mockCompany);
  });

  it('activate() should throw NotFound if key is missing', async () => {
    jest.spyOn(prisma.license, 'findUnique').mockResolvedValue(null);
    await expect(
      service.activate({ licenseKey: 'MISSING' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('activate() should throw BadRequest if license is revoked', async () => {
    jest.spyOn(prisma.license, 'findUnique').mockResolvedValue({
      ...mockLicense,
      status: LicenseStatus.REVOKED,
    } as any);
    await expect(service.activate({ licenseKey: 'RJ' } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('activate() should throw BadRequest if capacity exceeded', async () => {
    jest.spyOn(prisma.license, 'findUnique').mockResolvedValue({
      ...mockLicense,
      companies: [{}, {}], // 2 items = max capacity
    } as any);
    await expect(service.activate({ licenseKey: 'RJ' } as any)).rejects.toThrow(
      BadRequestException,
    );
  });
});
