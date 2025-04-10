import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { readdir, rm, stat } from 'fs/promises';
import { join } from 'path';
import { validate } from 'uuid';
import { DbService } from '../db/db.service';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';

@Injectable()
export class TasksService {
  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  // @Cron(CronExpression.EVERY_HOUR) // testing
  @Cron(CronExpression.EVERY_DAY_AT_4AM) // every day at 4:00 AM
  async cleanupTempDirectory() {
    this.logger.log('Cleanup temp directory via Cronjob');
    const rootTempDir = this.pathService.getRootTempDirectory();

    const readTempDir = await readdir(rootTempDir);
    readTempDir.forEach(async (dir, i) => {
      const dirPath = join(rootTempDir, dir);
      const tempDirStat = await stat(dirPath);

      // if temp folder is a valid uuid
      if (validate(dir)) {
        const ageInMs = new Date().valueOf() - tempDirStat.birthtime.valueOf();
        const ageInDays = ageInMs / 1000 / 60 / 60 / 24;
        // remove everything older than 7 days
        if (ageInDays > 7) {
          await rm(dirPath, { recursive: true });
          this.logger.info(
            'removed temp dir(' + Math.round(ageInDays) + 'd old): ' + dirPath,
          );
        }
      }
    });
  }
}
