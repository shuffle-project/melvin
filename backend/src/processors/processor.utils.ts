import { Job } from 'bull';
import { isSameObjectId } from '../utils/objectid';
import { ProcessProjectJob } from './processor.interfaces';

export function jobWithProjectIdExists(
  projectId: string,
  projectJobs: Job<ProcessProjectJob>[],
): boolean {
  return projectJobs.some((job) => isSameObjectId(job.data.project, projectId));
}
