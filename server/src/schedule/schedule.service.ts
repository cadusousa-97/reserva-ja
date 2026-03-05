import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetWeeklyScheduleDto } from './dto/set-weekly-schedule.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async setWeeklySchedule(dto: SetWeeklyScheduleDto, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado nesta empresa.');
    }

    const invalidBlock = dto.blocks.find(
      (block) => block.startTime >= block.endTime,
    );

    if (invalidBlock) {
      throw new BadRequestException(
        `Horário de início (${invalidBlock.startTime}) deve ser anterior ao horário de término (${invalidBlock.endTime}).`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.weeklySchedule.deleteMany({
        where: { employeeId: dto.employeeId, companyId },
      });

      return tx.weeklySchedule.createMany({
        data: dto.blocks.map((block) => ({
          employeeId: dto.employeeId,
          companyId,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
        })),
      });
    });
  }

  async getWeeklySchedule(employeeId: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado nesta empresa.');
    }

    return this.prisma.weeklySchedule.findMany({
      where: { employeeId, companyId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createException(dto: CreateScheduleExceptionDto, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado nesta empresa.');
    }

    if (!dto.isClosed && (!dto.startTime || !dto.endTime)) {
      throw new BadRequestException(
        'Quando isClosed é false, startTime e endTime são obrigatórios.',
      );
    }

    return this.prisma.scheduleException.create({
      data: {
        employeeId: dto.employeeId,
        companyId,
        date: new Date(dto.date),
        isClosed: dto.isClosed,
        startTime: dto.isClosed ? null : dto.startTime,
        endTime: dto.isClosed ? null : dto.endTime,
        reason: dto.reason,
      },
    });
  }

  async deleteException(id: string, companyId: string) {
    const exception = await this.prisma.scheduleException.findFirst({
      where: { id, companyId },
    });

    if (!exception) {
      throw new NotFoundException('Exceção de agenda não encontrada.');
    }

    return this.prisma.scheduleException.delete({ where: { id } });
  }

  async getAvailableSlots(employeeId: string, date: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const exceptions = await this.prisma.scheduleException.findMany({
      where: { employeeId, date: targetDate },
      orderBy: { startTime: 'asc' },
    });

    if (exceptions.some((e) => e.isClosed)) {
      return [];
    }

    const workingBlocks =
      exceptions.length > 0
        ? exceptions.map((e) => ({
            startTime: e.startTime!,
            endTime: e.endTime!,
          }))
        : (
            await this.prisma.weeklySchedule.findMany({
              where: { employeeId, dayOfWeek },
              orderBy: { startTime: 'asc' },
            })
          ).map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

    if (workingBlocks.length === 0) {
      return [];
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId,
        appointmentDate: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: { not: AppointmentStatus.CANCELED },
      },
      include: { service: true },
    });

    const bookedIntervals = appointments.map((apt) => {
      const start = apt.appointmentDate;
      const durationMs = (apt.service?.durationMinutes ?? 30) * 60 * 1000;
      return { start, end: new Date(start.getTime() + durationMs) };
    });

    const durationMs = service.durationMinutes * 60 * 1000;

    const stepMs =
      employee.company.scheduleType === 'FIXED' ? durationMs : 30 * 60 * 1000;

    return workingBlocks.flatMap((block) => {
      const blockStart = new Date(`${date}T${block.startTime}:00`);
      const blockEnd = new Date(`${date}T${block.endTime}:00`);

      return this.generateSlotCandidates(blockStart, blockEnd, stepMs)
        .filter((cursor) =>
          this.isSlotAvailable(cursor, blockEnd, durationMs, bookedIntervals),
        )
        .map((cursor) => this.formatSlot(cursor, durationMs));
    });
  }

  private generateSlotCandidates(
    blockStart: Date,
    blockEnd: Date,
    stepMs: number,
  ): Date[] {
    const totalSteps = Math.floor(
      (blockEnd.getTime() - blockStart.getTime()) / stepMs,
    );

    return Array.from(
      { length: totalSteps },
      (_, i) => new Date(blockStart.getTime() + i * stepMs),
    );
  }

  private isSlotAvailable(
    cursor: Date,
    blockEnd: Date,
    durationMs: number,
    bookedIntervals: { start: Date; end: Date }[],
  ): boolean {
    const slotEnd = new Date(cursor.getTime() + durationMs);

    if (slotEnd.getTime() > blockEnd.getTime()) {
      return false;
    }

    return !bookedIntervals.some(
      (booked) => cursor < booked.end && slotEnd > booked.start,
    );
  }

  private formatSlot(
    cursor: Date,
    durationMs: number,
  ): { startTime: string; endTime: string } {
    const slotEnd = new Date(cursor.getTime() + durationMs);

    return {
      startTime: cursor.toTimeString().slice(0, 5),
      endTime: slotEnd.toTimeString().slice(0, 5),
    };
  }
}
