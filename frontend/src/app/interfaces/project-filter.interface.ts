export enum ProjectSetEnum {
  All = 'all_projects',
  OWN = 'own_projects',
  SHARED = 'shared_projects',
}

export interface ProjectFilter {
  searchString: string;
  selectedProjectSet: ProjectSetEnum;
  selectedProjectStatus: string;
}
