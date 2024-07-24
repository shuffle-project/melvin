import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { ProjectFilter } from '../../interfaces/project-filter.interface';
import { ProjectListEntity } from '../../services/api/entities/project-list.entity';
import { ProjectEntity } from '../../services/api/entities/project.entity';

// edit projects list

export const createFromWS = createAction(
  '[WS SERVICE] Project created',
  props<{ createdProject: ProjectEntity }>()
);

export const remove = createAction(
  '[DELETE SERVICE] Remove Project',
  props<{ removeProjectId: string }>()
);

export const removeSuccess = createAction(
  '[PROJECT API] Remove project success',
  props<{ removedProjectId: string }>()
);

export const removeFail = createAction(
  '[PROJECT API] Remove project fail',
  props<{ error: HttpErrorResponse }>()
);

export const removeFromWS = createAction(
  '[WS SERVICE] Project removed, remove in local store',
  props<{ removedProjectId: string }>()
);

export const findAll = createAction(
  '[PROJECT LIST COMPONENT] Fetch all Projects'
);

export const findAllSuccess = createAction(
  '[PROJECT API] Fetch all Projects success',
  props<{
    projectListEntity: ProjectListEntity;
  }>()
);

export const findAllFail = createAction(
  '[PROJECT API] Fetch all Projects fail',
  props<{ error: HttpErrorResponse }>()
);

export const findOne = createAction(
  '[PROJECT DETAIL COMPONENT] Find one project',
  props<{ projectId: string }>()
);

export const findOneSuccess = createAction(
  '[PROJECT API] Find one project success',
  props<{ project: ProjectEntity }>()
);

export const findOneFail = createAction(
  '[PROJECT API] Find one project fail',
  props<{ error: HttpErrorResponse }>()
);

// edit single project

export const updateFromEditor = createAction(
  '[PROJECT DETAIL COMPONENT] Update Project',
  props<{ updateProject: ProjectEntity }>()
);

export const updateFromProjectList = createAction(
  '[PROJECT LIST COMPONENT] Update Project',
  props<{ updateProject: ProjectEntity }>()
);

export const updateSuccess = createAction(
  '[PROJECT API] Update Project success',
  props<{ updatedProject: ProjectEntity }>()
);

export const updateFail = createAction(
  '[PROJECT API] Update Project fail',
  props<{ error: HttpErrorResponse }>()
);

export const updateFromWS = createAction(
  '[PROJECT WS] Project updated',
  props<{ updatedProject: ProjectEntity }>()
);

export const updateFromWSPartial = createAction(
  '[PROJECT WS] Project updated PARTIAL',
  props<{ updatedProject: Partial<ProjectEntity> }>()
);

// others

export const updateFilter = createAction(
  '[Project List Component] Update Project Filter',
  props<{ updateProjectFilter: ProjectFilter }>()
);

export const select = createAction(
  '[PROJECT DETAIL COMPONENT] Select Project by Id',
  props<{ projectId: string }>()
);

export const updateProjectFromLiveControls = createAction(
  '[EDITOR LIVE-CONTROLS COMPONENT] Update project status',
  props<{ updateProject: ProjectEntity }>()
);

// invite
// TODO move invite.component.ts lines > 74 to store

// leave or remove
export const removeUserFromProject = createAction(
  '[PROJECT LIST COMPONENT] Leave Project',
  props<{ userId: string; projectId: string }>()
);

export const removeUserFromProjectSuccess = createAction(
  '[PROJECT API] Leave project success',
  props<{ projectId: string }>()
);

export const removeUserFromProjectFail = createAction(
  '[PROJECT API] Leave project fail',
  props<{ error: HttpErrorResponse }>()
);
