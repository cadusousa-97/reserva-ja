import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('activate')
  async activate(@Body() activateLicenseDto: ActivateLicenseDto) {
    return this.onboardingService.activate(activateLicenseDto);
  }
}
