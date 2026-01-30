import { IsEmail } from 'class-validator';

export class SendEmployeeInvitationDto {
  @IsEmail()
  email: string;
}
