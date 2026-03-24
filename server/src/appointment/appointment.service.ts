import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type ExistingAppointment = {
  appointmentDate: Date;
  service: { durationMinutes: number } | null;
};

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto, userId: string) {
    return this.withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const service = await this.getServiceOrThrow(tx, dto.serviceId);
          const employee = await this.getEmployeeOrThrow(tx, dto.employeeId);

          this.assertEmployeeAndServiceSameCompany(
            employee.companyId,
            service.companyId,
          );

          const companyId = employee.companyId;
          const customer = await this.getOrCreateCustomer(
            tx,
            userId,
            companyId,
          );

          const start = this.parseAppointmentDateOrThrow(dto.appointmentDate);
          const end = this.computeEndDate(start, service.durationMinutes);

          await this.assertNoOverlap(tx, {
            companyId,
            employeeId: employee.id,
            start,
            end,
          });

          return this.createAppointment(tx, {
            companyId,
            employeeId: employee.id,
            serviceId: service.id,
            customerId: customer.id,
            appointmentDate: start,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  findAll() {
    return `This action returns all appointment`;
  }

  findOne(id: string) {
    return `This action returns a #${id} appointment`;
  }

  update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    void updateAppointmentDto;
    return `This action updates a #${id} appointment`;
  }

  remove(id: string) {
    return `This action removes a #${id} appointment`;
  }

  private async withSerializableRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        // Serializable transactions can abort under contention; retry a few times.
        if (
          attempt < maxAttempts &&
          err instanceof PrismaClientKnownRequestError &&
          err.code === 'P2034'
        ) {
          continue;
        }

        throw err;
      }
    }

    // Unreachable in practice, but keeps control-flow explicit.
    throw new ConflictException('Falha ao processar agendamento.');
  }

  private async getServiceOrThrow(
    tx: Prisma.TransactionClient,
    serviceId: string,
  ) {
    const service = await tx.service.findUnique({ where: { id: serviceId } });

    if (!service || !service.isActive || !service.companyId) {
      throw new NotFoundException('Servico nao encontrado.');
    }

    return service;
  }

  private async getEmployeeOrThrow(
    tx: Prisma.TransactionClient,
    employeeId: string,
  ) {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    return employee;
  }

  private assertEmployeeAndServiceSameCompany(
    employeeCompanyId: string,
    serviceCompanyId: string | null,
  ) {
    if (employeeCompanyId !== serviceCompanyId) {
      throw new ConflictException(
        'Funcionário e serviço pertencem a empresas diferentes.',
      );
    }
  }

  private async getOrCreateCustomer(
    tx: Prisma.TransactionClient,
    userId: string,
    companyId: string,
  ) {
    const existing = await tx.customer.findFirst({
      where: { userId, companyId },
    });
    if (existing) return existing;

    try {
      return await tx.customer.create({ data: { userId, companyId } });
    } catch (err) {
      // If two requests race to create the same customer profile, rely on the unique constraint
      // and re-fetch.
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const fetched = await tx.customer.findFirst({
          where: { userId, companyId },
        });
        if (fetched) return fetched;
      }
      throw err;
    }
  }

  private parseAppointmentDateOrThrow(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      // ValidationPipe should catch invalid ISO strings, but keep a defensive guard.
      throw new BadRequestException('Data nao informada corretamente.');
    }
    return date;
  }

  private computeEndDate(start: Date, durationMinutes: number) {
    return new Date(start.getTime() + durationMinutes * 60 * 1000);
  }

  private getUtcDayBounds(date: Date): { dayStart: Date; dayEnd: Date } {
    // Use UTC boundaries to be consistent with DateTime storage; business rules may later
    // evolve to a "company timezone" model.
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    return { dayStart, dayEnd };
  }

  private async getExistingAppointmentsForDay(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      employeeId: string;
      dayStart: Date;
      dayEnd: Date;
    },
  ): Promise<ExistingAppointment[]> {
    const { companyId, employeeId, dayStart, dayEnd } = params;

    return tx.appointment.findMany({
      where: {
        companyId,
        employeeId,
        status: { not: AppointmentStatus.CANCELED },
        appointmentDate: { gte: dayStart, lt: dayEnd },
      },
      include: { service: { select: { durationMinutes: true } } },
      orderBy: { appointmentDate: 'asc' },
    });
  }

  private hasAnyOverlap(
    existing: ExistingAppointment[],
    desired: { start: Date; end: Date },
  ) {
    const { start, end } = desired;

    return existing.some((apt) => {
      const aptStart = apt.appointmentDate;
      const aptDurationMs = (apt.service?.durationMinutes ?? 30) * 60 * 1000;
      const aptEnd = new Date(aptStart.getTime() + aptDurationMs);
      return start < aptEnd && end > aptStart;
    });
  }

  private async assertNoOverlap(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      employeeId: string;
      start: Date;
      end: Date;
    },
  ) {
    const { companyId, employeeId, start, end } = params;
    const { dayStart, dayEnd } = this.getUtcDayBounds(start);

    const existing = await this.getExistingAppointmentsForDay(tx, {
      companyId,
      employeeId,
      dayStart,
      dayEnd,
    });

    if (this.hasAnyOverlap(existing, { start, end })) {
      throw new ConflictException(
        'Horario indisponivel para este funcionario.',
      );
    }
  }

  private createAppointment(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      employeeId: string;
      serviceId: string;
      customerId: string;
      appointmentDate: Date;
    },
  ) {
    const { companyId, employeeId, serviceId, customerId, appointmentDate } =
      params;

    return tx.appointment.create({
      data: {
        companyId,
        employeeId,
        serviceId,
        customerId,
        appointmentDate,
        status: AppointmentStatus.SCHEDULED,
      },
      include: { employee: true, customer: true, service: true },
    });
  }
}
