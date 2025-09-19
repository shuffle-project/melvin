import { createAction, props } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';

// Login && Logout
export const adminLogin = createAction(
  '[ADMIN COMPONENT] Admin login',
  props<{ username: string; password: string }>()
);

export const adminLoginSuccess = createAction(
  '[ADMIN API] Admin login success',
  props<{ token: string }>()
);

export const adminLoginFail = createAction(
  '[ADMIN API] Admin login fail',
  props<{ error: string }>()
);

export const adminLogout = createAction('[ADMIN COMPONENT] Admin logout');

// Find all users
export const adminFindAllUsers = createAction(
  '[ADMIN COMPONENT] Find all users'
);

export const adminFindAllUsersSuccess = createAction(
  '[ADMIN API] Find all users success',
  props<{ userList: { users: Readonly<UserEntityForAdmin[]> } }>()
);

export const adminFindAllUsersFail = createAction(
  '[ADMIN API] Find all users fail',
  props<{ error: string }>()
);

// Delete user by admin
export const adminDeleteUserAccount = createAction(
  '[ADMIN COMPONENT] Delete user by admin',
  props<{ userId: string }>()
);

export const adminDeleteUserAccountSuccess = createAction(
  '[ADMIN API] Delete user by admin success',
  props<{ userId: string }>()
);

export const adminDeleteUserAccountFail = createAction(
  '[ADMIN API] Delete user by admin fail',
  props<{ error: string }>()
);

// Update user by admin
export const adminUpdateUser = createAction(
  '[ADMIN EDIT EMAIL DIALOG COMPONENT] Update user by admin',
  props<{ userId: string; email: string; name: string }>()
);

export const adminUpdateUserSuccess = createAction(
  '[ADMIN API] Update user by admin success',
  props<{ user: UserEntityForAdmin }>()
);

export const adminUpdateUserFail = createAction(
  '[ADMIN API] Update user by admin fail',
  props<{ error: string }>()
);
