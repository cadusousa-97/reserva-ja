import type { Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyDto, VerifyResponseDto } from './dto/verify.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwtPayload.interface';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { EmployeeRole } from '@prisma/client';
import type { CompanyJwtPayload } from './interfaces/companyJwtPayload.interface';
import { SendEmployeeInvitationDto } from './dto/send-employee-invitation.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    const response = await this.authService.registerUser(signUpDto);

    await this.authService.sendToken(response.email);
  }

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    await this.authService.sendToken(signInDto.email);
  }

  @Post('register-employee')
  async registerEmployee(
    @Body() registerEmployeeDto: RegisterEmployeeDto,
    @Query('token', ParseUUIDPipe) token: string,
  ) {
    await this.authService.registerEmployee(registerEmployeeDto, token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verify(
    @Body() verifyDto: VerifyDto,
    @Res({ passthrough: true }) res: Response<VerifyResponseDto>,
  ) {
    const { access_token, userPayload } = await this.authService.verifyToken(
      verifyDto.email,
      verifyDto.token,
    );

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    const response: VerifyResponseDto = userPayload;

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-company')
  async verifyCompany(
    @Body() verifyCompanyDto: VerifyCompanyDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.verifyCompany(
      verifyCompanyDto.companyId,
      user.sub,
    );

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    return { name: user.name, email: user.email };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.OWNER, EmployeeRole.MANAGER)
  @Post('send-invitation')
  async sendEmployeeInvitation(
    @Body() sendEmployeeInvitation: SendEmployeeInvitationDto,
    @CurrentUser() user: CompanyJwtPayload,
  ) {
    await this.authService.sendEmployeeInvitation(
      sendEmployeeInvitation.email,
      user.companyId,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
