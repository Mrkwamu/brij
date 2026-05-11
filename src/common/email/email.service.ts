import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | undefined;
  logger: any;
  constructor(private readonly configService: ConfigService) {}

  private getClient() {
    if (!this.resend) {
      const key = this.configService.get<string>('RESEND_KEY');
      this.resend = new Resend(key);
    }
    return this.resend;
  }

  async accountVerification(email: string, otp: number) {
    // const from = this.configService.get<string>('FROM');

    const { data, error } = await this.getClient().emails.send({
      from: 'Brij <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm your Brij account',
      html: `
      <strong>
        Thank you for signing up to Brij.
        Here is your OTP code: ${otp}
      </strong>
    `,
    });

    if (error) {
      return console.error({ error });
    }

    return data;
  }
}
