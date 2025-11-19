import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import { verifyEmailTemplate } from './templates/verify-email.teplate';
import { forgotPasswordTemplate } from './templates/forgot-password.template';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MailService {
  //   private resend = new Resend(process.env.RESEND_API_KEY);
  //   async sendEmail(to: string | string[], subject: string, html: string) {
  //     try {
  //       const response = await this.resend.emails.send({
  //         from: 'AlFurqan Institute <onboarding@resend.dev>',
  //         to,
  //         subject,
  //         html,
  //       });
  //       console.log(response);
  //       return response;
  //     } catch (err) {
  //       console.error('Email send failed:', err);
  //       throw err;
  //     }
  //   }

  private transporter: nodemailer.Transporter;
  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('G_USER'), // your email address
        pass: this.config.get<string>('G_PASS'), // app password
      },
    });
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }) {
    try {
      const { to, subject, html } = options;

      const mailOptions = {
        from:
          options.from ||
          process.env.G_USER ||
          'No-Reply <alfurqanaim@gmail.com>',
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📨 Email sent:', result.messageId);
      return result;
    } catch (err) {
      console.error('❌ Email sending failed:', err);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendVerificationEmail(data: {
    email: string;
    token: string | null;
    firstName: string;
    lastName: string;
    origin: string;
  }) {
    const html = verifyEmailTemplate(data);
    const options = { to: data.email, subject: 'Email Verification', html };
    return this.sendEmail(options);
  }

  async sendPasswordResetEmail(data: {
    email: string;
    token: string;
    firstName: string;
    lastName: string;
    origin: string;
  }) {
    const html = forgotPasswordTemplate(data);
    const options = { to: data.email, subject: 'Reset Your Password', html };
    return this.sendEmail(options);
  }
}
