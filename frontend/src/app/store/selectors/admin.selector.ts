import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from '../reducers/admin.reducer';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

export const isLoggedIn = createSelector(
  selectAdminState,
  (state) => state.token !== null
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
