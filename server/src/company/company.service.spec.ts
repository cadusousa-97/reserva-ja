import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Company } from '@prisma/client';
import { CompanyType } from './dto/create-company.dto';

describe('CompanyService', () => {
  let service: CompanyService;
  let prisma: PrismaService;

  const mockCompanyData: Company = {
    name: 'Jhon Doe Barber',
    id: '38f5283e-b519-448d-b724-5f013f1e0a77',
    cpfCnpj: '11122233344',
    companyType: 'BARBERSHOP',
    createdAt: new Date(),
  };
  const mockCreateCompanyPayload = {
    name: 'Jhon Doe Barber',
    cpfCnpj: '11122233344',
    companyType: CompanyType.BARBERSHOP,
    address: {
      street: 'Nova Rua',
      number: '01',
      city: 'Camaragibe',
      state: 'PE',
      zipCode: '51111222',
      complement: 'Casa B',
      landmark: 'Ao lado da igreja',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: {
            company: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    test('Should find and return the company data', () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(
        mockCompanyData,
      );

      expect(service.findOne(mockCompanyData.id)).resolves.toMatchObject(
        mockCompanyData,
      );
    });
  });

  test('Should create a company', async () => {
    (prisma.company.create as jest.Mock).mockResolvedValue(
      mockCreateCompanyPayload,
    );

    await service.createCompany(mockCreateCompanyPayload);

    expect(
      service.createCompany(mockCreateCompanyPayload),
    ).resolves.toMatchObject(mockCreateCompanyPayload);

    expect(prisma.company.create as jest.Mock).toHaveBeenCalledWith({
      data: {
        name: mockCreateCompanyPayload.name,
        cpfCnpj: mockCreateCompanyPayload.cpfCnpj,
        companyType: mockCreateCompanyPayload.companyType,
        addresses: {
          create: {
            ...mockCreateCompanyPayload.address,
          },
        },
      },
    });
  });
});
