import { createReducer, on } from '@ngrx/store';
import { UserEntity } from 'src/app/services/api/entities/user.entity';
import * as adminActions from '../actions/admin.actions';

export interface AdminState {
  loginLoading: boolean;
  loginError: string | null;
  token: string | null;

  // TODO any
  userList: Readonly<UserEntity[]>;
}

export const initialState: AdminState = {
  loginLoading: false,
  loginError: null,
  token: null,

  userList: [],
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
    userList,
  })),

  // Logout
  on(adminActions.logoutAdmin, (state) => ({ ...state, token: null }))
);
