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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiBooleanSuccessResponseDto,
  ApiErrorResponseDto,
  ApiMessageResponseDto,
} from '../common/swagger/dto/api-response.dto';

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth('bearer')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @ApiOperation({ summary: 'Cria uma nova conta e envia token de verificacao' })
  @ApiBody({ type: SignUpDto })
  @ApiCreatedResponse({
    description: 'Conta criada e token enviado por e-mail.',
  })
  @ApiBadRequestResponse({
    description: 'Erro de validacao dos dados enviados.',
    type: ApiErrorResponseDto,
  })
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    const response = await this.authService.registerUser(signUpDto);

    await this.authService.sendToken(response.email);
  }

  @ApiOperation({ summary: 'Solicita token de login por e-mail' })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    description: 'Token enviado por e-mail.',
  })
  @ApiBadRequestResponse({
    description: 'Erro de validacao do e-mail.',
    type: ApiErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    await this.authService.sendToken(signInDto.email);
  }

  @ApiOperation({ summary: 'Registra colaborador com token de convite' })
  @ApiBody({ type: RegisterEmployeeDto })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token UUID de convite para cadastro do colaborador',
    example: '6a03bc6c-d2f5-4e2b-85f4-767fdd53a5cd',
  })
  @ApiCreatedResponse({
    description: 'Colaborador registrado com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Token invalido ou dados de cadastro incorretos.',
    type: ApiErrorResponseDto,
  })
  @Post('register-employee')
  async registerEmployee(
    @Body() registerEmployeeDto: RegisterEmployeeDto,
    @Query('token', ParseUUIDPipe) token: string,
  ) {
    await this.authService.registerEmployee(registerEmployeeDto, token);
  }

  @ApiOperation({
    summary: 'Valida token de login e retorna perfil do usuario',
  })
  @ApiBody({ type: VerifyDto })
  @ApiOkResponse({
    description: 'Token validado; cookies de acesso e refresh definidos.',
    type: VerifyResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Token invalido, expirado ou payload incorreto.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({
    summary: 'Seleciona empresa ativa para o usuario autenticado',
  })
  @ApiCreatedResponse({
    description: 'Empresa selecionada e novos cookies emitidos.',
    schema: {
      example: {
        name: 'Ana Silva',
        email: 'ana@empresa.com',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Empresa invalida para o usuario.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({ summary: 'Envia convite de colaborador para uma empresa' })
  @ApiBody({ type: SendEmployeeInvitationDto })
  @ApiCreatedResponse({
    description: 'Convite enviado com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'E-mail invalido ou dados incorretos.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario sem permissao/autenticacao para enviar convite.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({ summary: 'Encerra sessao no dispositivo atual' })
  @ApiCreatedResponse({
    description: 'Cookies de autenticacao removidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({
    summary: 'Renova tokens a partir do refresh token em cookie',
  })
  @ApiOkResponse({
    description: 'Tokens renovados com sucesso.',
    type: ApiBooleanSuccessResponseDto,
    schema: { example: { success: true } },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token ausente, invalido ou revogado.',
    type: ApiErrorResponseDto,
  })
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

  @ApiOperation({
    summary: 'Encerra sessao em todos os dispositivos do usuario',
  })
  @ApiCreatedResponse({
    description: 'Todos os refresh tokens do usuario foram revogados.',
    type: ApiMessageResponseDto,
    schema: {
      example: { message: 'Desconectado de todos os dispositivos.' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
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
