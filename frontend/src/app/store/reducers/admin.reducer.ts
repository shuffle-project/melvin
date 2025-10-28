import { createReducer, on } from '@ngrx/store';
import { TeamEntity } from 'src/app/services/api/entities/team.entity';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import * as adminActions from '../actions/admin.actions';

export interface AdminState {
  loginLoading: boolean;
  loginError: string | null;
  token: string | null;

  newEmailLoading: boolean;
  newEmailError: string | null;
  userWithNewEmail: UserEntityForAdmin | null;

  passwordMethod: 'email' | 'return' | null;
  newUserPasswordLoading: boolean;
  newUserPassword: string | null;
  newUserError: string | null;

  userList: { users: Readonly<UserEntityForAdmin[]> };

  teamList: { teams: TeamEntity[] };
}

export const initialState: AdminState = {
  loginLoading: false,
  loginError: null,
  token: null,

  newEmailLoading: false,
  newEmailError: null,
  userWithNewEmail: null,

  passwordMethod: null,
  newUserPasswordLoading: false,
  newUserPassword: null,
  newUserError: null,

  userList: { users: [] },

  teamList: { teams: [] },
};

export const adminReducer = createReducer(
  initialState,

  on(adminActions.adminLoginSuccess, (state, { token }) => ({
    ...state,
    token,
    loginLoading: false,
  })),

  on(adminActions.adminLoginFail, (state, { error }) => ({
    ...state,
    loginError: error.error?.message || error.message,
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
  on(adminActions.adminUpdateUserEmail, (state) => ({
    ...state,
    newEmailLoading: true,
    newEmailError: null,
  })),

  on(adminActions.adminUpdateUserEmailSuccess, (state, { user }) => ({
    ...state,
    newEmailLoading: false,
    newEmailError: null,
    userWithNewEmail: user,
    userList: {
      users: state.userList.users.map((u) => (u.id === user.id ? user : u)),
    },
  })),

  on(adminActions.adminUpdateUserEmailFail, (state, { error }) => ({
    ...state,
    newEmailLoading: false,
    newEmailError: error.error?.message || error.message,
    userWithNewEmail: null,
  })),

  on(adminActions.adminClearUpdateUserEmail, (state) => ({
    ...state,
    newEmailLoading: false,
    newEmailError: null,
    userWithNewEmail: null,
  })),

  // New user password
  on(
    adminActions.adminResetUserPassword,

    (state) => ({
      ...state,
      newUserPasswordLoading: true,
    })
  ),

  on(
    adminActions.adminResetUserPasswordSuccess,
    (state, { method, password }) => ({
      ...state,
      passwordMethod: method,
      newUserPassword: password,
      newUserPasswordLoading: false,
    })
  ),

  on(adminActions.adminResetUserPasswordFail, (state) => ({
    ...state,
    newUserPasswordLoading: false,
  })),

  on(adminActions.adminClearUserPassword, (state) => ({
    ...state,
    newUserError: null,
    newUserPassword: null,
    passwordMethod: null,
    newUserPasswordLoading: false,
  })),

  on(adminActions.adminCreateUser, (state) => ({
    ...state,
    newUserPasswordLoading: true,
    newUserError: null,
  })),

  on(adminActions.adminCreateUserFail, (state, { error }) => ({
    ...state,
    newUserPasswordLoading: false,
    newUserError: error.error?.message || error.message,
  })),

  on(
    adminActions.adminCreateUserSuccess,
    (state, { method, password, user }) => ({
      ...state,
      newUserError: null,
      passwordMethod: method,
      newUserPassword: password,
      newUserPasswordLoading: false,
      userList: { users: [user, ...state.userList.users] },
    })
  ),

  // verify user email by admin
  on(adminActions.adminVerifyUserEmailSuccess, (state, { user }) => ({
    ...state,
    userList: {
      users: state.userList.users.map((u) => (u.id === user.id ? user : u)),
    },
  })),

  // Teams
  on(adminActions.adminFindAllTeamsSuccess, (state, { teamList }) => ({
    ...state,
    teamList: { ...teamList },
  }))
);
