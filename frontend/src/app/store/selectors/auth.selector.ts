import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CustomLogger } from '../../classes/logger.class';
import { AuthUser } from '../../interfaces/auth.interfaces';
import { AuthState } from '../reducers/auth.reducer';
import { selectRouteParam } from './router.selectors';

const logger = new CustomLogger('AUTH SELECTOR');

const decodeJWT = <T>(token: string): T => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (err: any) {
    logger.error(err.message, err);
    throw new Error('Decoding JWT failed');
  }
};

export const authState = createFeatureSelector<AuthState>('auth');

// General

export const selectIsLoggedIn = createSelector(
  authState,
  (state) => state.token !== null
);
export const selectIsLoggedOut = createSelector(
  authState,
  (state) => state.token === null && state.isInitialized
);
export const selectUser = createSelector(authState, (state) =>
  state.token ? decodeJWT<AuthUser>(state.token) : null
);
export const selectUserId = createSelector(authState, (state) =>
  state.token ? decodeJWT<AuthUser>(state.token).id : null
);
export const selectToken = createSelector(authState, (state) => state.token);

// Initialization

export const selectInitialized = createSelector(
  authState,
  (state: AuthState) => state.isInitialized
);

// Login

export const selectLoginLoading = createSelector(
  authState,
  (state) => state.loginLoading
);
export const selectLoginError = createSelector(
  authState,
  (state) => state.loginError
);

// change password
export const selectChangePasswordLoading = createSelector(
  authState,
  (state) => state.changePasswordLoading
);
export const selectChangePasswordError = createSelector(
  authState,
  (state) => state.changePasswordError
);

// Register

export const selectRegisterLoading = createSelector(
  authState,
  (state) => state.registerLoading
);
export const selectRegisterError = createSelector(
  authState,
  (state) => state.registerError
);
export const selectRegisterSuccess = createSelector(
  authState,
  (state) => state.registerSuccess
);

// Invite

export const selectInviteTokenRoute = createSelector(
  selectRouteParam('inviteToken'),
  (token) => token
);

export const selectInviteTokenCache = createSelector(
  authState,
  (state) => state.inviteToken
);

export const selectInviteLoading = createSelector(
  authState,
  (state) => state.inviteLoading
);

// Initialization

export const selectInviteError = createSelector(
  authState,
  (state) => state.inviteError
);

export const selectInviteEntity = createSelector(
  authState,
  (state) => state.inviteEntity
);

// websocket connect

export const selectIsUserConnectedToWs = createSelector(
  authState,
  (state) => state.websocketConnected
);
