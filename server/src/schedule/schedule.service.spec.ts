import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: PrismaService;

  const mockEmployee = { id: 'emp-1', companyId: 'comp-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findFirst: jest.fn().mockResolvedValue(mockEmployee),
              findUnique: jest.fn().mockResolvedValue({
                ...mockEmployee,
                company: { scheduleType: 'FLOATING' },
              }),
            },
            weeklySchedule: {
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn(),
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
            scheduleException: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation((args) => args.data),
              delete: jest.fn(),
            },
            appointment: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            service: {
              findUnique: jest
                .fn()
                .mockResolvedValue({ id: 'svc-1', durationMinutes: 30 }),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              const tx = {
                weeklySchedule: {
                  deleteMany: jest.fn(),
                  createMany: jest.fn().mockResolvedValue({ count: 2 }),
                },
              };
              return cb(tx);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setWeeklySchedule', () => {
    it('should replace weekly schedule for an employee', async () => {
      const dto = {
        employeeId: 'emp-1',
        blocks: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
          { dayOfWeek: 1, startTime: '13:00', endTime: '18:00' },
        ],
      };

      const result = await service.setWeeklySchedule(dto, 'comp-1');

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', companyId: 'comp-1' },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ count: 2 });
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(prisma.employee, 'findFirst').mockResolvedValue(null);

      await expect(
        service.setWeeklySchedule(
          { employeeId: 'missing', blocks: [] },
          'comp-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if startTime >= endTime', async () => {
      await expect(
        service.setWeeklySchedule(
          {
            employeeId: 'emp-1',
            blocks: [{ dayOfWeek: 1, startTime: '18:00', endTime: '08:00' }],
          },
          'comp-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWeeklySchedule', () => {
    it('should return weekly schedule blocks', async () => {
      const mockBlocks = [
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
      ];
      jest
        .spyOn(prisma.weeklySchedule, 'findMany')
        .mockResolvedValue(mockBlocks as any);

      const result = await service.getWeeklySchedule('emp-1', 'comp-1');

      expect(result).toEqual(mockBlocks);
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(prisma.employee, 'findFirst').mockResolvedValue(null);

      await expect(
        service.getWeeklySchedule('missing', 'comp-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createException', () => {
    it('should create a day-off exception', async () => {
      const dto = {
        employeeId: 'emp-1',
        date: '2026-12-25',
        isClosed: true,
      };

      const result = await service.createException(dto, 'comp-1');

      expect(prisma.scheduleException.create).toHaveBeenCalled();
      expect(result.isClosed).toBe(true);
    });

    it('should throw BadRequest when isClosed=false without times', async () => {
      const dto = {
        employeeId: 'emp-1',
        date: '2026-12-25',
        isClosed: false,
      };

      await expect(service.createException(dto, 'comp-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteException', () => {
    it('should throw NotFoundException if exception not found', async () => {
      jest.spyOn(prisma.scheduleException, 'findFirst').mockResolvedValue(null);

      await expect(
        service.deleteException('missing', 'comp-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return empty array when employee has no schedule', async () => {
      jest.spyOn(prisma.weeklySchedule, 'findMany').mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        'emp-1',
        '2026-10-27',
        'svc-1',
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when exception marks day as closed', async () => {
      jest
        .spyOn(prisma.scheduleException, 'findMany')
        .mockResolvedValue([{ isClosed: true }] as any);

      const result = await service.getAvailableSlots(
        'emp-1',
        '2026-10-27',
        'svc-1',
      );

      expect(result).toEqual([]);
    });

    it('should generate slots with step equal to service duration when scheduleType is FIXED', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({
        id: 'emp-1',
        company: { scheduleType: 'FIXED' },
      } as any);

      jest
        .spyOn(prisma.weeklySchedule, 'findMany')
        .mockResolvedValue([{ startTime: '09:00', endTime: '12:00' }] as any);

      // Service duration is 60 minutes
      jest
        .spyOn(prisma.service, 'findUnique')
        .mockResolvedValueOnce({ id: 'svc-60', durationMinutes: 60 } as any);

      const result = await service.getAvailableSlots(
        'emp-1',
        '2026-10-27',
        'svc-60',
      );

      // Should only generate options right at the hour mark (09, 10, 11) rather than 09:30, 10:30, etc.
      expect(result).toEqual([
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '12:00' },
      ]);
    });

    it('should generate 30-min slots and exclude booked ones', async () => {
      jest
        .spyOn(prisma.weeklySchedule, 'findMany')
        .mockResolvedValue([{ startTime: '09:00', endTime: '11:00' }] as any);

      jest.spyOn(prisma.appointment, 'findMany').mockResolvedValue([
        {
          appointmentDate: new Date('2026-10-27T09:30:00'),
          service: { durationMinutes: 30 },
        },
      ] as any);

      const result = await service.getAvailableSlots(
        'emp-1',
        '2026-10-27',
        'svc-1',
      );

      expect(result).toEqual([
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '10:30', endTime: '11:00' },
      ]);
    });

    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getAvailableSlots('emp-1', '2026-10-27', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getAvailableSlots('missing', '2026-10-27', 'svc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
