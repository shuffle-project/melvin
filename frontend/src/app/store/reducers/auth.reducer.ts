import { createReducer, on } from '@ngrx/store';
import { InviteEntity } from '../../services/api/entities/auth.entity';
import * as authActions from '../actions/auth.actions';

export interface AuthState {
  // General
  isInitialized: boolean;
  error: string | null;
  token: string | null;

  // Login
  loginLoading: boolean;
  loginError: string | null;

  // Change password
  changePasswordLoading: boolean;
  changePasswordError: string | null;

  // Register
  registerLoading: boolean;
  registerError: string | null;
  registerSuccess: boolean;

  inviteLoading: boolean;
  inviteError: string | null;
  inviteEntity: InviteEntity | null;
  inviteToken: string | null;

  websocketConnected: boolean;
}

export const initialState: AuthState = {
  isInitialized: false,
  error: null,
  token: null,

  // Login
  loginLoading: false,
  loginError: null,

  // change password
  changePasswordLoading: false,
  changePasswordError: null,

  // Register
  registerLoading: false,
  registerError: null,
  registerSuccess: false,

  // Invite
  inviteLoading: false,
  inviteError: null,
  inviteEntity: null,
  inviteToken: null,

  //is user connected to websocket
  websocketConnected: false,
};

export const authReducer = createReducer(
  initialState,

  // Initialization
  on(authActions.initSuccess, (state, action) => ({
    ...state,
    isInitialized: true,
    token: action.token,
  })),

  // Login
  on(authActions.login, (state, action) => ({
    ...state,
    loginLoading: true,
    loginError: null,
    persistent: action.persistent,
  })),
  on(authActions.loginSuccess, (state, action) => ({
    ...state,
    loginLoading: false,
    token: action.token,
  })),
  on(authActions.loginError, (state, action) => ({
    ...state,
    loginLoading: false,
    loginError: action.error.message,
  })),
  on(authActions.clearLoginError, (state) => ({
    ...state,
    loginError: null,
  })),

  //change password

  on(authActions.changePassword, (state, action) => ({
    ...state,
    changePasswordLoading: true,
    loginError: null,
  })),
  on(authActions.changePasswordSuccess, (state, action) => ({
    ...state,
    changePasswordLoading: false,
    token: action.entity.token,
  })),
  on(authActions.changePasswordError, (state, action) => ({
    ...state,
    changePasswordLoading: false,
    changePasswordError: action.error.message,
  })),
  on(authActions.clearChangePasswordError, (state) => ({
    ...state,
    changePasswordError: null,
  })),

  // Logout
  on(authActions.logout, (state) => ({ ...state, token: null })),

  // Register
  on(authActions.register, (state, action) => ({
    ...state,
    registerLoading: true,
    registerError: null,
    registerSuccess: false,
  })),
  on(authActions.registerSuccess, (state, action) => ({
    ...state,
    registerLoading: false,
    registerSuccess: true,
  })),
  on(authActions.registerError, (state, action) => ({
    ...state,
    registerLoading: false,
    registerError: action.error.message,
  })),
  on(authActions.clearRegisterError, (state) => ({
    ...state,
    registerError: null,
  })),

  // Invite
  on(authActions.verifyInviteToken, (state) => ({
    ...state,
    inviteLoading: true,
    inviteError: null,
    inviteEntity: null,
  })),
  on(authActions.verifyInviteTokenSuccess, (state, action) => ({
    ...state,
    inviteLoading: false,
    inviteEntity: {
      projectId: action.inviteEntity.projectId,
      projectTitle: action.inviteEntity.projectTitle,
      userName: action.inviteEntity.userName,
    },
    inviteToken: action.token,
  })),
  on(authActions.verifyInviteTokenError, (state, action) => ({
    ...state,
    inviteLoading: false,
    inviteError: action.error.message,
  })),

  //websocket connect
  on(authActions.userConnectedToWebsocket, (state) => ({
    ...state,
    websocketConnected: true,
  })),

  // verify email success
  on(authActions.verifyEmailSuccess, (state, action) => ({
    ...state,
    token: action.token,
  }))
);
