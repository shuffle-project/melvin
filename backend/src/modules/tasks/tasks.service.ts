import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { validate } from 'uuid';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';

@Injectable()
export class TasksService {
  constructor(private logger: CustomLogger, private pathService: PathService) {
    this.logger.setContext(this.constructor.name);
  }

  // @Cron('30 * * * * *') // every minute in the 30th second -> for testing
  @Cron('0 4 * * *') // every day at 4:00 AM
  async cleanupTempDirectory() {
    this.logger.log('Cleanup temp directory via Cronjob');
    const rootTempDir = this.pathService.getRootTempDirectory();

    const readTempDir = await readdir(rootTempDir);
    readTempDir.forEach(async (dir, i) => {
      const dirPath = join(rootTempDir, dir);
      const tempDirStat = await stat(dirPath);

      if (validate(dir)) {
        const ageInMs = new Date().valueOf() - tempDirStat.birthtime.valueOf();
        const ageInDays = ageInMs / 1000 / 60 / 60 / 24;
        if (ageInDays > 7) {
          console.log('====' + dir);
          console.log('age in days:', ageInDays);

          //   await rmdir(dirPath, { recursive: true });
          this.logger.info(
            'removed temp dir(' + Math.round(ageInDays) + '): ' + dirPath,
          );
        }
      }
    });
  }
}
