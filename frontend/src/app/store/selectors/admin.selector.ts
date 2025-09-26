import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from '../reducers/admin.reducer';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

export const isLoggedIn = createSelector(
  selectAdminState,
  (state) => state.token !== null
);

export const selectLoginError = createSelector(
  selectAdminState,
  (state) => state.loginError
);

export const selectAllUsers = createSelector(
  selectAdminState,
  (state) => state.userList
);

export const selectToken = createSelector(
  selectAdminState,
  (state) => state.token
);

export const selectNewUserPassword = createSelector(
  selectAdminState,
  (state) => state.newUserPassword
);

export const selectNewUserPasswordLoading = createSelector(
  selectAdminState,
  (state) => state.newUserPasswordLoading
);

export const selectPasswordMethod = createSelector(
  selectAdminState,
  (state) => state.passwordMethod
);

export const selectNewUserError = createSelector(
  selectAdminState,
  (state) => state.newUserError
);
