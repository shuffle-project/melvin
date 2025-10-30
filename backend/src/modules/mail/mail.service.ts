import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  EmailConfig,
  RegistrationConfig,
  RegistrationMode,
} from 'src/config/config.interface';
import { AdminCreateUserDto } from 'src/resources/admin/dto/admin-create-user.dto';
import { LeanProjectDocument } from '../db/schemas/project.schema';
import { LeanUserDocument, User } from '../db/schemas/user.schema';
import { CustomLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  emailConfig: EmailConfig;
  registrationConfig: RegistrationConfig;
  baseFrontendUrl: string;
  transporter: Transporter;

  constructor(
    private logger: CustomLogger,
    private configService: ConfigService,
  ) {
    this.logger.setContext(this.constructor.name);

    this.emailConfig = this.configService.get<EmailConfig>('email');
    this.registrationConfig =
      this.configService.get<RegistrationConfig>('registration');
    this.baseFrontendUrl = this.configService.get<string>('baseFrontendUrl');
  }

  isActive() {
    return this.emailConfig !== undefined && this.transporter;
  }

  async onApplicationBootstrap(): Promise<void> {
    if (
      this.registrationConfig.mode === RegistrationMode.EMAIL &&
      !this.emailConfig
    ) {
      this.logger.error('email registration enabled but no email config set');
      throw new Error('email registration enabled but no email config set');
    }

    if (this.emailConfig) {
      this.logger.info('MailService is configured. starting up...');
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
        this.logger.info('MailService is ready to send mails');
      });
    }
  }

  async sendAdminCreateUserMail(
    createUserDto: AdminCreateUserDto,
    password: string,
  ) {
    const emailSubject = '[Melvin] Your account has been created';
    const emailBody = `Hello ${createUserDto.name},

    an account has been created for you. Here are your login details:
    
    Email: ${createUserDto.email}
    Password: ${password}
    
    Please log in and change your password as soon as possible: ${this.baseFrontendUrl}
    
    This is a system-generated email. For any questions please contact the administrator.`;

    return this._sendMail(
      createUserDto.name,
      createUserDto.email,
      emailSubject,
      emailBody,
    );
  }

  async sendPasswordResetMail(user: User, password: string) {
    const emailSubject = '[Melvin] Your password has been reset';
    const emailBody = `Hello ${user.name},

    your password has been reset by an administrator. Your new password is:  
    
    ${password}
    
    Please log in and change your password as soon as possible: ${this.baseFrontendUrl}
    
    This is a system-generated email. For any questions please contact the administrator.`;

    return this._sendMail(user.name, user.email, emailSubject, emailBody);
  }

  async sendVerifyEmail(user: User) {
    const emailSubject = '[Melvin] Please verify your email address';
    const emailBody = `Hello ${user.name},

    click the following link to verify your Melvin account with your email address:

    ${this.baseFrontendUrl}/verify-email?token=${user.emailVerificationToken}&email=${user.email}

    This is a system-generated email. For any questions please contact the administrator.`;

    return this._sendMail(user.name, user.email, emailSubject, emailBody);
  }

  async sendForgotPassword(user: User) {
    const emailSubject = '[Melvin] A password reset was requested';
    const emailBody = `Hello ${user.name},

    click the following link to reset your password for your Melvin account:

    ${this.baseFrontendUrl}/reset-password?token=${user.emailVerificationToken}&email=${user.email}

    This is a system-generated email. For any questions please contact the administrator.`;

    return this._sendMail(user.name, user.email, emailSubject, emailBody);
  }

  async sendInviteEmail(
    project: LeanProjectDocument,
    user: LeanUserDocument,
    emails: string[],
  ): Promise<void> {
    this.logger.info(`send invites to ${emails.join(', ')}`);

    // TODO thats not project invite, more melvin account invite
    // emails.forEach(async (email) => {
    //   const emailSubject = `[Melvin] You got invited to a project`;
    //   const emailBody = `Hello,

    //   ${user.name} has invited you to join the project "${project.title}" on Melvin.

    //   Kind regards
    //   The Melvin Team
    //   `;

    //   await this._sendMail(email, email, emailSubject, emailBody);
    // });
  }

  async _sendMail(
    recipientName: string,
    recipientMail: string,
    subject: string,
    text: string,
    html?: string,
  ) {
    if (!this.transporter) {
      this.logger.warn('MailService not configured, cannot send mail');
      this.logger.warn('Mail was not sent:');
      this.logger.warn(
        JSON.stringify({ recipientName, recipientMail, subject, text, html }),
      );
    } else {
      return this.transporter.sendMail({
        from: `Melvin <${this.emailConfig.mailFrom}>`,
        to: `${recipientName} <${recipientMail}>`,
        subject,
        text,
        html,
      });
    }
  }
}
