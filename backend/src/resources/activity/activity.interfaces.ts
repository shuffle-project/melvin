import { ProjectStatus } from '../../modules/db/schemas/project.schema';
import { TranscriptionEntity } from '../transcription/entities/transcription.entity';
import { UserEntity } from '../user/entities/user.entity';

export interface ActivitiesMap {
  'project-created': any;
  'project-status-updated': { before: ProjectStatus; after: ProjectStatus };
  'project-title-updated': { before: string; after: string };
  'video-processing-finished': any;
  'video-processing-failed': {
    error: Error;
  };
  'subtitles-processing-finished': {
    transcription: TranscriptionEntity;
  };
  'subtitles-processing-failed': {
    error: Error;
  };
  'project-user-joined': { user: UserEntity };
  'project-user-left': { user: UserEntity };
}

export type ActivityAction = keyof ActivitiesMap;
export type ActivityDetails = ActivitiesMap[keyof ActivitiesMap];
