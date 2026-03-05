import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { SetWeeklyScheduleDto } from './dto/set-weekly-schedule.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CompanyJwtPayload } from '../auth/interfaces/companyJwtPayload.interface';
import { EmployeeRole } from '@prisma/client';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Put('weekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  setWeeklySchedule(
    @Body() dto: SetWeeklyScheduleDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.setWeeklySchedule(dto, user.companyId);
  }

  @Get('weekly/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  getWeeklySchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.getWeeklySchedule(employeeId, user.companyId);
  }

  @Post('exception')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  createException(
    @Body() dto: CreateScheduleExceptionDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.createException(dto, user.companyId);
  }

  @Delete('exception/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  deleteException(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    return this.scheduleService.deleteException(id, user.companyId);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('employeeId') employeeId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.scheduleService.getAvailableSlots(employeeId, date, serviceId);
  }
}
