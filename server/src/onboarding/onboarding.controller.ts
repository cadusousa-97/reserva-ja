import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-response.dto';

@Controller('onboarding')
@ApiTags('Onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({ summary: 'Ativa uma licenca e conclui onboarding inicial' })
  @ApiBody({ type: ActivateLicenseDto })
  @ApiOkResponse({ description: 'Onboarding concluido com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para ativacao da licenca.',
    type: ApiErrorResponseDto,
  })
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('activate')
  async activate(@Body() activateLicenseDto: ActivateLicenseDto) {
    return this.onboardingService.activate(activateLicenseDto);
  }
}
