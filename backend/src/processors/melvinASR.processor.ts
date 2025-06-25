import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CustomLogger } from '../modules/logger/logger.service';

export interface ProcessMelvinASRJob {
  // TODO
}

@Processor('melvinASR')
export class MelvinASRProcessor {
  constructor(private logger: CustomLogger) {
    this.logger.setContext(this.constructor.name);
  }

  @Process()
  async fetchResult(job: Job<ProcessMelvinASRJob>) {
    this.logger.verbose('Starting Melvin ASR Job Processing');
  }
}
