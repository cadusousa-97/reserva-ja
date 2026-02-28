import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [OnboardingService],
  imports: [PrismaModule, AuthModule, MailModule, JwtModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
