import { createAction, props } from '@ngrx/store';

export const playFromWS = createAction(
  '[FROM WS] Play',
  props<{ projectId: string }>()
);

export const updateCurrentTimeFromWS = createAction(
  '[FROM WS] Update current time',
  props<{ projectId: string; currentTime: number }>()
);

export const resumeFromUserTestEffect = createAction(
  '[USER TEST EFFECTS] Resume'
);

export const stopFromWS = createAction(
  '[FROM WS] Stop',
  props<{ projectId: string }>()
);
