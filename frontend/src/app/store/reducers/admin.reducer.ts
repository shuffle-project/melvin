import { createReducer, on } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import * as adminActions from '../actions/admin.actions';

export interface AdminState {
  loginLoading: boolean;
  loginError: string | null;
  token: string | null;

  newUserPassword: string | null;

  userList: { users: Readonly<UserEntityForAdmin[]> };
}

export const initialState: AdminState = {
  loginLoading: false,
  loginError: null,
  token: null,

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
  on(adminActions.adminResetUserPasswordSuccess, (state, { password }) => ({
    ...state,
    newUserPassword: password,
  })),

  on(adminActions.adminClearUserPassword, (state) => ({
    ...state,
    newUserPassword: null,
  }))
);
