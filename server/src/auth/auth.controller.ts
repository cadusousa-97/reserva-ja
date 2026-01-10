import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from 'src/dto/signIn.dto';
import { VerifyDto, VerifyResponseDto } from 'src/dto/verify.dto';
import { VerifyCompanyDto } from 'src/dto/verifyCompany.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwtPayload.interface';
import { SignUpDto } from 'src/dto/signUp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    await this.authService.register(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    await this.authService.sendToken(signInDto.email);
  }

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
