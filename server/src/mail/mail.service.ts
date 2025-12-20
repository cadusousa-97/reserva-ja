import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Mail } from './interfaces/mail.interface';

@Injectable()
export class MailService {
  async sendMail(mailObject: Mail) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: mailObject.to,
      subject: mailObject.subject,
      text: mailObject.text,
    });
  }
}
