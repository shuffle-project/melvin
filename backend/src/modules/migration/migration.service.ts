import { Injectable } from '@nestjs/common';
import { PopulateService } from '../../resources/populate/populate.service';
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

    const version = settings.dbSchemaVersion;

    // if (version < 2) {
    //   // Do migration here
    // }
  }
}
