import { createReducer, on } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import * as adminActions from '../actions/admin.actions';

export interface AdminState {
  loginLoading: boolean;
  loginError: string | null;
  token: string | null;

  userList: { users: Readonly<UserEntityForAdmin[]> };
}

export const initialState: AdminState = {
  loginLoading: false,
  loginError: null,
  token: null,

  userList: { users: [] },
};

export const adminReducer = createReducer(
  initialState,

  on(adminActions.loginAdminSuccess, (state, { token }) => ({
    ...state,
    token,
    loginLoading: false,
  })),

  on(adminActions.findAllUsersSuccess, (state, { userList }) => ({
    ...state,
    userList: userList,
  })),

  // Logout
  on(adminActions.logoutAdmin, (state) => ({
    ...state,
    token: null,
    userList: { users: [] },
  }))
);
