import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@Controller('onboarding')
@ApiTags('Onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('activate')
  async activate(@Body() activateLicenseDto: ActivateLicenseDto) {
    return this.onboardingService.activate(activateLicenseDto);
  }
}
