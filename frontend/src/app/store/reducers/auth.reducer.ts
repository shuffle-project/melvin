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

  // Register
  registerLoading: boolean;
  registerError: string | null;
  registerSuccess: boolean;

  // TODO: Password Reset

  // TODO: Invite-Link / Guest-Login
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

  // guest login
  on(authActions.guestLoginSuccess, (state, action) => ({
    ...state,
    token: action.token,
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
  }))
);
