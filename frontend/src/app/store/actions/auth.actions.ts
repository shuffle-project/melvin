import { createAction, props } from '@ngrx/store';
import { ChangePasswordDto } from '../../services/api/dto/auth.dto';
import {
  ChangePasswordEntity,
  GuestLoginEntity,
  InviteEntity,
} from '../../services/api/entities/auth.entity';

// Initialization

export const init = createAction('[APP COMPONENT] Init auth');

export const initSuccess = createAction(
  '[AUTH EFFECTS] Init auth success',
  props<{ token: string | null }>()
);

export const initRefreshToken = createAction(
  '[AUTH EFFECTS] Init refresh token',
  props<{ token: string }>()
);

// Login

export const login = createAction(
  '[LOGIN COMPONENT] Login',
  props<{ email: string; password: string; persistent: boolean }>()
);

export const loginSuccess = createAction(
  '[AUTH EFFECTS] Login success',
  props<{ token: string }>()
);

export const loginError = createAction(
  '[AUTH EFFECTS] Login error',
  props<{ error: Error }>()
);

// change password
export const changePassword = createAction(
  '[PROFILE COMPONENT] Change password',
  props<{ dto: ChangePasswordDto }>()
);

export const changePasswordSuccess = createAction(
  '[AUTH EFFECTS] Change password success',
  props<{ entity: ChangePasswordEntity }>()
);

export const changePasswordError = createAction(
  '[AUTH EFFECTS] Change password failed',
  props<{ error: Error }>()
);

// Logout

export const logout = createAction('[HEADER COMPONENT] Logout');

// Register

export const register = createAction(
  '[REGISTER COMPONENT] Register',
  props<{ name: string; email: string; password: string }>()
);

export const registerSuccess = createAction('[AUTH EFFECTS] Register success');

export const registerError = createAction(
  '[AUTH EFFECTS] Register error',
  props<{ error: Error }>()
);

// Invite

export const verifyInviteToken = createAction(
  '[INVITE COMPONENT] Verify invite token'
);

export const verifyInviteTokenSuccess = createAction(
  '[AUTH EFFECTS] Verify invite token success',
  props<{ inviteEntity: InviteEntity; token: string }>()
);

export const verifyInviteTokenError = createAction(
  '[AUTH EFFECTS] Verify invite token error',
  props<{ error: Error }>()
);

export const guestLogin = createAction(
  '[INVITE COMPONENT] Guest Login',
  props<{ name?: string }>()
);

export const guestLoginSuccess = createAction(
  '[AUTH EFFECTS] Guest Login success',
  props<GuestLoginEntity>()
);

export const guestLoginError = createAction(
  '[AUTH EFFECTS] Guest Login error',
  props<{ error: Error }>()
);

// connect user to websocket
export const userConnectedToWebsocket = createAction(
  '[WS SERVICE] user successfully connected to Websocket'
);
