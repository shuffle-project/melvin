import { Injectable } from '@nestjs/common';
import { PopulateService } from '../../resources/populate/populate.service';
import { generateSecureToken } from '../../utils/crypto';
import { DbService } from '../db/db.service';
import { CustomLogger } from '../logger/logger.service';

@Injectable()
export class MigrationService {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    private populateService: PopulateService,
  ) {
    this.logger.setContext('Migration');
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.info('Initialize migration check');
    let settings = await this.db.settingsModel.findOne({});

    if (settings === null) {
      this.logger.info('First application start');
      settings = await this.db.settingsModel.create({ version: 1 });
      this.logger.info('Create example project');
      await this.populateService.populate([], 1);
    }

    if (settings.dbSchemaVersion < 2) {
      const projects = await this.db.projectModel.find({});
      for (const project of projects) {
        project.inviteToken = generateSecureToken();
        project.viewerToken = generateSecureToken();
        await project.save();
      }
      settings.dbSchemaVersion = 2;
      await settings.save();
    }
  }
}
