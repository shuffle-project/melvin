import { HttpErrorResponse } from '@angular/common/http';
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
  props<{ error: HttpErrorResponse }>()
);

export const adminInit = createAction('[ADMIN COMPONENT] Admin init');

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
  props<{ error: HttpErrorResponse }>()
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
  props<{ error: HttpErrorResponse }>()
);

// Update user by admin
export const adminUpdateUserEmail = createAction(
  '[ADMIN EDIT EMAIL DIALOG COMPONENT] Update user by admin',
  props<{ userId: string; email: string }>()
);

export const adminUpdateUserEmailSuccess = createAction(
  '[ADMIN API] Update user by admin success',
  props<{ user: UserEntityForAdmin }>()
);

export const adminUpdateUserEmailFail = createAction(
  '[ADMIN API] Update user by admin fail',
  props<{ error: HttpErrorResponse }>()
);

export const adminClearUpdateUserEmail = createAction(
  '[ADMIN EDIT EMAIL DIALOG COMPONENT] Clear update user email state'
);

// Reset password by admin
export const adminResetUserPassword = createAction(
  '[ADMIN RESET PASSWORD DIALOG COMPONENT] Reset user password by admin',
  props<{ userId: string }>()
);

export const adminResetUserPasswordSuccess = createAction(
  '[ADMIN API] Reset user password by admin success',
  props<{ method: 'email' | 'return'; password: string }>()
);

export const adminResetUserPasswordFail = createAction(
  '[ADMIN API] Reset user password by admin fail',
  props<{ error: HttpErrorResponse }>()
);

export const adminClearUserPassword = createAction(
  '[ADMIN RESET PASSWORD DIALOG COMPONENT] Clear user password'
);

// Admin create user
export const adminCreateUser = createAction(
  '[ADMIN CREATE USER DIALOG COMPONENT] Create user by admin',
  props<{ email: string; name: string }>()
);

export const adminCreateUserSuccess = createAction(
  '[ADMIN API] Create user by admin success',
  props<{
    method: 'email' | 'return';
    password: string;
    user: UserEntityForAdmin;
  }>()
);

export const adminCreateUserFail = createAction(
  '[ADMIN API] Create user by admin fail',
  props<{ error: HttpErrorResponse }>()
);

// Verify user email by admin
export const adminVerifyUserEmail = createAction(
  '[ADMIN COMPONENT] Verify user email by admin',
  props<{ userId: string }>()
);

export const adminVerifyUserEmailSuccess = createAction(
  '[ADMIN API] Verify user email by admin success',
  props<{ user: UserEntityForAdmin }>()
);

export const adminVerifyUserEmailFail = createAction(
  '[ADMIN API] Verify user email by admin fail',
  props<{ error: HttpErrorResponse }>()
);
