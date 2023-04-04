import { routerReducer, RouterState } from '@ngrx/router-store';
import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { AuthEffects } from './effects/auth.effects';
import { CaptionsEffects } from './effects/captions.effects';
import { ConfigEffects } from './effects/config.effects';
import { EditorEffects } from './effects/editor.effects';
import { NotificationsEffects } from './effects/notifications.effects';
import { ProjectEffects } from './effects/projects.effects';
import { TranscriptionsEffects } from './effects/transcriptions.effects';
import { UserTestEffects } from './effects/user-test.effects';
import { authReducer, AuthState } from './reducers/auth.reducer';
import { captionsReducer, CaptionsState } from './reducers/captions.reducer';
import { configReducer, ConfigState } from './reducers/config.reducer';
import { editorReducer, EditorState } from './reducers/editor.reducer';
import {
  notificationReducer,
  NotificationsState,
} from './reducers/notifications.reducer';
import { projectsReducer, ProjectsState } from './reducers/projects.reducer';
import {
  transcriptionsReducer,
  TranscriptionsState,
} from './reducers/transcriptions.reducer';

export interface AppState {
  router: RouterState;
  editor: EditorState;
  captions: CaptionsState;
  projects: ProjectsState;
  auth: AuthState;
  notification: NotificationsState;
  transcriptions: TranscriptionsState;
  config: ConfigState;
}

export const actionReducerMap: ActionReducerMap<AppState> = {
  router: routerReducer,
  editor: editorReducer,
  captions: captionsReducer,
  projects: projectsReducer,
  auth: authReducer,
  notification: notificationReducer,
  transcriptions: transcriptionsReducer,
  config: configReducer,
};

export const effectsList = [
  CaptionsEffects,
  ProjectEffects,
  EditorEffects,
  AuthEffects,
  TranscriptionsEffects,
  NotificationsEffects,
  ConfigEffects,
  UserTestEffects,
];

//meta reducers
// console.log all actions
export function debug(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state, action) {
    // console.log('state', state);
    // console.log('action', action);

    return reducer(state, action);
  };
}

export const metaReducers: MetaReducer<any>[] = [debug];
