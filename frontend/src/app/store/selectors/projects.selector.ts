import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectSetEnum } from '../../interfaces/project-filter.interface';
import { ProjectsState } from '../reducers/projects.reducer';
import * as authSelectors from '../selectors/auth.selector';

// export const selectRouter = createFeatureSelector<RouterState>('router');
// export const selectQueryParam = getSelector(selectRouter);

export const selectProjectsState =
  createFeatureSelector<ProjectsState>('projects');

export const selectAllProjects = createSelector(
  selectProjectsState,
  (state: ProjectsState) => state.projectsList
);

export const selectOwnProjects = createSelector(
  selectProjectsState,
  authSelectors.selectUserId,
  (state: ProjectsState, authUserId: string | null) =>
    state.projectsList.filter((project) => project.createdBy.id === authUserId)
);

export const selectSharedProjects = createSelector(
  selectProjectsState,
  authSelectors.selectUserId,
  (state: ProjectsState, authUserId: string | null) =>
    state.projectsList.filter((project) => project.createdBy.id !== authUserId)
);

export const selectProjectFilter = createSelector(
  selectProjectsState,
  (state: ProjectsState) => state.projectFilter
);

export const selectFilteredProjects = createSelector(
  selectProjectsState,
  authSelectors.selectUserId,
  (state: ProjectsState, authUserId: string | null) => {
    let filter = state.projectFilter;

    return state.projectsList
      .filter((project) => {
        if (
          filter.selectedProjectSet === ProjectSetEnum.OWN &&
          project.createdBy.id !== authUserId
        )
          return false;
        if (
          filter.selectedProjectSet === ProjectSetEnum.SHARED &&
          project.createdBy.id === authUserId
        )
          return false;

        return true;
      })
      .filter(
        (project) =>
          filter.selectedProjectStatus === 'all' ||
          filter.selectedProjectStatus === project.status
      )
      .filter((project) => {
        if (filter.searchString === '') return true;
        if (
          project.title
            .toLowerCase()
            .includes(filter.searchString.toLowerCase())
        )
          return true;

        return false;
      });
  }
);
