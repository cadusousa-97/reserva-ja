import type { Request, Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
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
import { RefreshTokenService } from './refresh-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

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
    const { access_token, refresh_token, userPayload } =
      await this.authService.verifyToken(verifyDto.email, verifyDto.token);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const response: VerifyResponseDto = userPayload;

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-company')
  async verifyCompany(
    @Body() verifyCompanyDto: VerifyCompanyDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies['refresh_token'];

    if (oldRefreshToken) {
      await this.refreshTokenService.revoke(oldRefreshToken);
    }

    const { access_token, refresh_token } =
      await this.authService.verifyCompany(
        verifyCompanyDto.companyId,
        user.sub,
      );

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado.');
    }

    const { access_token, refresh_token: newRefreshToken } =
      await this.refreshTokenService.refresh(refreshToken);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAllDevices(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.refreshTokenService.revokeAllForUser(user.sub);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Desconectado de todos os dispositivos.' };
  }
}
