import { ProjectStatus } from './project.entity';
import { TranscriptionEntity } from './transcription.entity';
import { UserEntity } from './user.entity';

export interface ActivityEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  action: ActivityAction;
  details?: ActivityDetails;
  project: {
    id: string;
    title: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

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
  // 'export-ready':{linkToResource:string}
}

export type ActivityAction = keyof ActivitiesMap;
export type ActivityDetails = ActivitiesMap[keyof ActivitiesMap];
