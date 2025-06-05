import { Job } from 'bull';
import { isSameObjectId } from '../utils/objectid';
import { ProcessProjectJob } from './processor.interfaces';

export function jobWithProjectIdExists(
  projectId: string,
  // subtitleJobs: Job<ProcessSubtitlesJob>[],
  projectJobs: Job<ProcessProjectJob>[],
): boolean {
  return (
    // subtitleJobs.some((job) => isSameObjectId(job.data.project, projectId)) ||
    projectJobs.some((job) => isSameObjectId(job.data.project, projectId))
  );
}
