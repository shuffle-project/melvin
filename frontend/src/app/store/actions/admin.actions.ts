import { createAction, props } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';

// Login && Logout
export const loginAdmin = createAction(
  '[ADMIN COMPONENT] Admin login',
  props<{ username: string; password: string }>()
);

export const loginAdminSuccess = createAction(
  '[ADMIN API] Admin login success',
  props<{ token: string }>()
);

export const loginAdminFail = createAction(
  '[ADMIN API] Admin login fail',
  props<{ error: string }>()
);

export const logoutAdmin = createAction('[ADMIN COMPONENT] Admin logout');

// Find all users
export const findAllUsers = createAction('[ADMIN COMPONENT] Find all users');

export const findAllUsersSuccess = createAction(
  '[ADMIN API] Find all users success',
  props<{ userList: { users: Readonly<UserEntityForAdmin[]> } }>()
);

export const findAllUsersFail = createAction(
  '[ADMIN API] Find all users fail',
  props<{ error: string }>()
);
