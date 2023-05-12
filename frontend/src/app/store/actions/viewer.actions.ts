import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { ProjectEntity } from '../../services/api/entities/project.entity';

export const findProject = createAction(
  '[VIEWER COMPONENT] Find project',
  props<{ projectId: string }>()
);

export const findProjectSuccess = createAction(
  '[PROJECT API] Find project success TODO', // TODO
  props<{ project: ProjectEntity }>()
);

export const findProjectFail = createAction(
  '[PROJECT API] Find project fail TODO', // TODO gleiche actions gibts auch in editror
  props<{ error: HttpErrorResponse }>()
);
