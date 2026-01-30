import { Injectable } from '@nestjs/common';
import { Mail } from './interfaces/mail.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(mailObject: Mail) {
    await this.mailerService.sendMail({
      from: process.env.GMAIL_USER,
      to: mailObject.to,
      subject: mailObject.subject,
      template: mailObject.template,
      context: mailObject.context,
    });
  }
}
