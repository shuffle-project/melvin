import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  EmailConfig,
  RegistrationConfig,
  RegistrationMode,
} from 'src/config/config.interface';
import { CreateUserDto } from 'src/resources/admin/dto/create-user.dto';
import { LeanProjectDocument } from '../db/schemas/project.schema';
import { LeanUserDocument, User } from '../db/schemas/user.schema';
import { CustomLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  emailConfig: EmailConfig;
  registrationConfig: RegistrationConfig;
  transporter: Transporter;

  constructor(
    private logger: CustomLogger,
    private configService: ConfigService,
  ) {
    this.logger.setContext(this.constructor.name);

    this.emailConfig = this.configService.get<EmailConfig>('email');
    this.registrationConfig =
      this.configService.get<RegistrationConfig>('registration');
  }

  isActive() {
    // TODO
    return this.emailConfig !== undefined && this.transporter;
  }

  async onApplicationBootstrap(): Promise<void> {
    if (
      this.registrationConfig.mode === RegistrationMode.EMAIL &&
      !this.emailConfig
    ) {
      // TODO throw? or error log?
      this.logger.error('email registration enabled but no email config set');
      throw new Error('email registration enabled but no email config set');
    }

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
    }
  }

  async sendAdminCreateUserMail(
    createUserDto: CreateUserDto,
    password: string,
  ) {
    const emailSubject = '[Melvin] Your Account Has Been Created';
    const emailBody = `Hello ${createUserDto.name},

    an account has been created for you on Melvin.
    
    Here are your login details:
    
    Email: ${createUserDto.email}
    Password: ${password}
    
    Please log in and change your password immediately for security reasons.
    
    Kind regards
    The Melvin Team`;

    return this._sendMail(
      createUserDto.name,
      createUserDto.email,
      emailSubject,
      emailBody,
    );
  }

  async sendPasswordResetMail(user: User, password: string) {
    const emailSubject = '[Melvin] Password Reset';

    const emailBody = `Hello ${user.name},

    as requested, here is the password for your Melvin account:
    
    ${password}
    
    For your security, please change this password immediately after signing in. We recommend choosing a strong, unique password.
    
    Kind regards
    The Melvin Team`;

    return this._sendMail(user.name, user.email, emailSubject, emailBody);
  }

  async sendVerifyEmail(user: User) {
    const emailSubject = '[Melvin] Verify E-Mail';

    // TODO
    const emailBody = `Hello ${user.name},

    click the following link to verify your Melvin account with your email address:
    https://melvin.shuffle-projekt.de/verify-email?token=${user.emailVerificationToken}

    
    Kind regards
    The Melvin Team`;

    return this._sendMail(user.name, user.email, emailSubject, emailBody);
  }

  async sendForgotPassword(user: User) {
    const emailSubject = '[Melvin] Password Reset Request';
    const emailBody = `Hello ${user.name},


    click the following link to reset your password for your Melvin account:
    TODO

    Kind regards
    The Melvin Team`;

    return this._sendMail;
  }

  async sendInviteEmail(
    project: LeanProjectDocument,
    user: LeanUserDocument,
    emails: string[],
  ): Promise<void> {
    this.logger.info(`send invites to ${emails.join(', ')}`);
  }

  async _sendMail(
    recipientName: string,
    recipientMail: string,
    subject: string,
    text: string,
    html?: string,
  ) {
    if (this.transporter)
      return this.transporter.sendMail({
        from: `Melvin <${this.emailConfig.mailFrom}>`,
        to: `${recipientName} <${recipientMail}>`,
        subject,
        text,
        html,
      });
  }
}
