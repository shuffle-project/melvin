import { ProjectEntity } from './project.entity';

export interface ProjectListEntity {
  projects: ProjectEntity[];
  total: number;
  page: number;
}
