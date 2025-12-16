import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('Auth service', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            employee: { findFirst: jest.fn() },
            user: { findUnique: jest.fn() },
            token: { create: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('send', () => {
    test('Should create a token in db', async () => {
      const mockUser = {
        id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
        name: 'Carlos',
        email: 'test@email.com',
        phone: '81900000000',
      };

      const mockToken = {
        id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
        userId: 'a00ac000-0000-0000-ab0f-000a00b0e111',
        token: 'some_token',
        createdAt: Date.now(),
        expiresAt: Date.now(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.token.create as jest.Mock).mockResolvedValue(mockToken);

      await service.send(mockUser.email);

      expect(prisma.token.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('verifyCompany', () => {
    test('Should return a object with employee and user data', () => {
      const mockEmployee = {
        id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
        userId: 'a00ac000-0000-0000-ab0f-000a00b0e111',
        companyId: 'a00ac000-0000-0000-ab0f-000a00b0e222',
        role: 'REGULAR',
        user: {
          id: 'a00ac000-0000-0000-ab0f-000a00b0e111',
          email: 'test@email.com',
          name: 'Carlos',
          phone: '81988888888',
          createdAt: Date.now(),
        },
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (jwt.signAsync as jest.Mock).mockResolvedValue('mock_token');

      expect(
        service.verifyCompany(mockEmployee.companyId, mockEmployee.userId),
      ).resolves.toMatchObject({ access_token: 'mock_token' });
    });

    test('Should return UnauthorizedException if user is not employee', () => {
      const mockCompanyId: string = 'a00ac000-0000-0000-ab0f-000a00b0e000';
      const mockUserId: string = 'a00ac000-0000-0000-ab0f-000a00b0e000';

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      expect(service.verifyCompany(mockCompanyId, mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
