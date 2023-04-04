import { Injectable } from '@nestjs/common';
import { LeanProjectDocument } from '../db/schemas/project.schema';
import { LeanUserDocument } from '../db/schemas/user.schema';
import { CustomLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  constructor(private logger: CustomLogger) {
    this.logger.setContext(this.constructor.name);
  }

  async sendInviteEmail(
    project: LeanProjectDocument,
    user: LeanUserDocument,
    emails: string[],
  ): Promise<void> {
    this.logger.info(`send invites to ${emails.join(', ')}`);
  }
}
