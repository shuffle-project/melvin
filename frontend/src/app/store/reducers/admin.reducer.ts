import { createReducer, on } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import * as adminActions from '../actions/admin.actions';

export interface AdminState {
  loginLoading: boolean;
  loginError: string | null;
  token: string | null;

  passwordMethod?: 'email' | 'return' | null;
  newUserPasswordLoading?: boolean;
  newUserPassword: string | null;

  userList: { users: Readonly<UserEntityForAdmin[]> };
}

export const initialState: AdminState = {
  loginLoading: false,
  loginError: null,
  token: null,

  passwordMethod: null,
  newUserPasswordLoading: false,
  newUserPassword: null,

  userList: { users: [] },
};

export const adminReducer = createReducer(
  initialState,

  on(adminActions.adminLoginSuccess, (state, { token }) => ({
    ...state,
    token,
    loginLoading: false,
  })),

  on(adminActions.adminFindAllUsersSuccess, (state, { userList }) => ({
    ...state,
    userList: userList,
  })),

  // Logout
  on(adminActions.adminLogout, (state) => ({
    ...state,
    token: null,
    userList: { users: [] },
  })),

  // Delete user by admin
  on(adminActions.adminDeleteUserAccountSuccess, (state, { userId }) => ({
    ...state,
    userList: {
      users: state.userList.users.filter((user) => user.id !== userId),
    },
  })),

  // Update user by admin
  on(adminActions.adminUpdateUserSuccess, (state, { user }) => ({
    ...state,
    userList: {
      users: state.userList.users.map((u) => (u.id === user.id ? user : u)),
    },
  })),

  // New user password
  on(
    adminActions.adminResetUserPassword,
    adminActions.adminCreateUser,
    (state) => ({
      ...state,
      newUserPasswordLoading: true,
    })
  ),

  on(
    adminActions.adminResetUserPasswordSuccess,
    adminActions.adminCreateUserSuccess,
    (state, { method, password }) => ({
      ...state,
      passwordMethod: method,
      newUserPassword: password,
      newUserPasswordLoading: false,
    })
  ),

  on(
    adminActions.adminResetUserPasswordFail,
    adminActions.adminCreateUserFail,
    (state, { error }) => ({
      ...state,
      newUserPasswordLoading: false,
    })
  ),

  on(adminActions.adminClearUserPassword, (state) => ({
    ...state,
    newUserPassword: null,
    passwordMethod: null,
    newUserPasswordLoading: false,
  }))
);
