import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import * as argon2 from 'argon2';
import { MailService } from 'src/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';

jest.mock('argon2');

describe('Auth service', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;
  let mail: MailService;

  const mockHashedToken = 'some_hashed_token';
  const mockUser = {
    id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
    name: 'Carlos',
    email: 'test@email.com',
    phone: '81900000000',
    createdAt: Date.now(),
  };
  const mockToken = {
    id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
    userId: 'a00ac000-0000-0000-ab0f-000a00b0e111',
    token: '1a2b3c4d5e',
    createdAt: Date.now(),
    expiresAt: Date.now(),
  };
  const mockMail = {
    to: mockUser.email,
    subject: 'Reserva Já: Código de acesso',
    text: '111111',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            employee: { findFirst: jest.fn() },
            user: { findUnique: jest.fn(), create: jest.fn() },
            token: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
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
    mail = module.get<MailService>(MailService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    (argon2.hash as jest.Mock).mockResolvedValue('hashed_token');
    (jwt.signAsync as jest.Mock).mockResolvedValue('mock_token');
  });

  describe('register', () => {
    test('Should call send token service if the user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const sendTokenSpy = jest
        .spyOn(service, 'sendToken')
        .mockResolvedValue(undefined);

      await service.register(mockUser);

      expect(prisma.user.create as jest.Mock).not.toHaveBeenCalled();
      expect(sendTokenSpy).toHaveBeenCalledWith(mockUser.email);
    });

    test('Should create a user if cannot find one', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const sendTokenSpy = jest
        .spyOn(service, 'sendToken')
        .mockResolvedValue(undefined);

      await service.register(mockUser);

      expect(prisma.user.create as jest.Mock).toHaveBeenCalledWith({
        data: {
          email: mockUser.email,
          name: mockUser.name,
          phone: mockUser.phone,
        },
      });
      expect(sendTokenSpy).toHaveBeenCalledWith(mockUser.email);
    });
  });

  describe('send', () => {
    test('Should create a token in db', async () => {
      const mockToken = {
        id: 'a00ac000-0000-0000-ab0f-000a00b0e000',
        userId: 'a00ac000-0000-0000-ab0f-000a00b0e111',
        token: 'some_token',
        createdAt: Date.now(),
        expiresAt: Date.now(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.token.create as jest.Mock).mockResolvedValue(mockToken);

      await service.sendToken(mockUser.email);

      expect(prisma.token.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: 'hashed_token',
          expiresAt: expect.any(Date),
        },
      });
    });

    test('Should send the email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const sendMailSpy = jest
        .spyOn(mail, 'sendMail')
        .mockResolvedValue(undefined);

      jest.spyOn(crypto, 'randomInt' as any).mockReturnValue(111111);

      await service.sendToken(mockUser.email);

      expect(sendMailSpy).toHaveBeenCalledWith(mockMail);
    });
  });

  describe('verifyToken', () => {
    test('Should throw NotFoundException if user not found', () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      expect(
        service.verifyToken(mockUser.email, mockHashedToken),
      ).rejects.toThrow(NotFoundException);
    });

    test('Should throw UnauthorizedException if token is invalid or expired', () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.token.findMany as jest.Mock).mockResolvedValue([]);

      expect(
        service.verifyToken(mockUser.email, mockHashedToken),
      ).rejects.toThrow(UnauthorizedException);
    });
    test('Should verify token and return access_token', () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.token.findMany as jest.Mock).mockResolvedValue([mockToken]);
      (prisma.token.delete as jest.Mock).mockResolvedValue(mockToken);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      expect(
        service.verifyToken(mockUser.email, mockHashedToken),
      ).resolves.toMatchObject({
        access_token: 'mock_token',
        user: mockUser,
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
