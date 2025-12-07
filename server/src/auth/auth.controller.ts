import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from 'src/dto/signIn.dto';
import { VerifyDto } from 'src/dto/verify.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.login(signInDto.email);
  }

  @Post('verify')
  async verify(@Body() verifyDto: VerifyDto) {
    const tokens = await this.authService.verify(
      verifyDto.email,
      verifyDto.token,
    );
  }
}
