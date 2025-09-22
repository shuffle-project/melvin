import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { EmailConfig } from 'src/config/config.interface';
import { LeanProjectDocument } from '../db/schemas/project.schema';
import { LeanUserDocument } from '../db/schemas/user.schema';
import { CustomLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  emailConfig: EmailConfig;
  transporter: Transporter;

  constructor(
    private logger: CustomLogger,
    private configService: ConfigService,
  ) {
    this.logger.setContext(this.constructor.name);

    this.emailConfig = this.configService.get<EmailConfig>('email');
  }

  async onApplicationBootstrap(): Promise<void> {
    console.log('onapplicationBootstrap mail');
    console.log(this.emailConfig);
    if (this.emailConfig) {
      this.transporter = createTransport({
        host: this.emailConfig.smtpServer,
        port: this.emailConfig.smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.emailConfig.user,
          pass: this.emailConfig.password,
        },
      });
      this.transporter.verify().then((v) => {
        console.log('verified:', v);
      });

      // this.transporter
      //   .sendMail({
      //     from: `${this.emailConfig.mailFromName} <${this.emailConfig.mailFrom}>`,
      //     to: 'benedikt.reuter@posteo.de',
      //     subject: 'Test Email from melvin',
      //     text: ' This is a test email to verify the SMTP configuration.',
      //   })
      //   .then((info) => {
      //     console.log(info);
      //   })
      //   .catch((err) => {
      //     console.error(err);
      //   });
    }
  }

  async _sendMail(subject: string, text: string, html: string) {
    return await this.transporter.sendMail({
      from: `Melvin Admin <${this.emailConfig.mailFrom}>`,
      // to: `Recipient <${this.emailConfig.mailFrom}>`,
      to: `Recipient <benedikt.reuter@posteo.de>`,
      subject,
      text,
      html,
    });
  }

  async sendInviteEmail(
    project: LeanProjectDocument,
    user: LeanUserDocument,
    emails: string[],
  ): Promise<void> {
    this.logger.info(`send invites to ${emails.join(', ')}`);
  }
}
