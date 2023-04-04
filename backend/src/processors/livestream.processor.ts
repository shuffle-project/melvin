import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { random } from 'lodash';
import { DbService } from '../modules/db/db.service';
import { ProjectStatus } from '../modules/db/schemas/project.schema';
import { CustomLogger } from '../modules/logger/logger.service';
import { AuthService } from '../resources/auth/auth.service';
import { EventsGateway } from '../resources/events/events.gateway';
import { ProjectService } from '../resources/project/project.service';

export interface ProcessLivestreamJob {
  projectId: string;
}

@Processor('livestream')
export class LivestreamProcessor {
  constructor(
    private logger: CustomLogger,
    private db: DbService,
    @InjectQueue('livestream')
    private livestreamQueue: Queue<ProcessLivestreamJob>,
    private projectService: ProjectService,
    private authService: AuthService,
    private events: EventsGateway,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Process()
  async transcode(job: Job<ProcessLivestreamJob>) {
    this.logger.verbose('Livestream running');
    const project = await this.db.findProjectByIdOrThrow(job.data.projectId);

    if (project.status === ProjectStatus.LIVE) {
      setTimeout(async () => {
        const systemUser = await this.authService.findSystemAuthUser();

        const min = random(0, 50);
        const max = random(min, 100);

        await Promise.all([
          this.projectService.update(systemUser, project._id, {
            duration: project.duration + 1000,
          }),
          this.livestreamQueue.add({ projectId: project._id }),
          this.events.projectMediaWaveformUpdated(
            project,
            Array(100)
              .fill(0)
              .map((o) => random(min, max, false)),
          ),
        ]);
      }, 1000);
    } else {
      this.logger.verbose('Livestream ended');
    }
  }
}
