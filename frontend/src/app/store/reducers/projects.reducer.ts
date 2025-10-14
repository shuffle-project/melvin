import { createReducer, on } from '@ngrx/store';
import {
  ProjectFilter,
  ProjectSetEnum,
} from 'src/app/interfaces/project-filter.interface';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import * as projectsActions from '../actions/projects.actions';

export interface ProjectsState {
  projectsList: ReadonlyArray<ProjectEntity>;
  projectFilter: ProjectFilter;
  projectListLoading: boolean;
}

export const initialState: ProjectsState = {
  projectsList: [],
  projectFilter: {
    searchString: '',
    selectedProjectSet: ProjectSetEnum.All,
    selectedProjectStatus: 'all',
  },
  projectListLoading: false,
};

export const projectsReducer = createReducer(
  initialState,

  on(
    projectsActions.createFromWS,
    projectsActions.createFromDefaultCreation,
    (state, { createdProject }) => ({
      ...state,
      projectsList: [{ ...createdProject }, ...state.projectsList],
    })
  ),

  // modify one single project by id functions
  on(projectsActions.updateSuccess, (state, { updatedProject }) => ({
    ...state,
    projectsList: state.projectsList.map((item) => {
      if (item.id !== updatedProject.id) {
        return item;
      }

      return {
        ...item,
        ...updatedProject,
      };
    }),
  })),

  // retrieve Data from API functions
  on(projectsActions.findAllSuccess, (state, action) => {
    let projects = action.projectListEntity.projects;

    projects = projects.map((project) => {
      const allDates = [
        project.updatedAt,
        ...project.transcriptions.map((t) => t.updatedAt),
      ];
      return { ...project, updatedAt: allDates.sort().reverse()[0] };
    });

    return {
      ...state,
      projectsList: [...projects],
    };
  }),

  on(
    projectsActions.removeSuccess,
    projectsActions.removeFromWS,
    (state, { removedProjectId }) => {
      return {
        ...state,
        projectsList: state.projectsList.filter(
          (item) => item.id !== removedProjectId
        ),
      };
    }
  ),

  on(projectsActions.updateFromWS, (state, { updatedProject, authUserId }) => {
    const userStillPartOfProject = updatedProject.users.find(
      (user) => user.id === authUserId
    );

    let projectsList = state.projectsList;

    if (!userStillPartOfProject) {
      projectsList = projectsList.filter(
        (item) => item.id !== updatedProject.id
      );
    }

    return {
      ...state,
      projectsList: projectsList.map((item) => {
        if (item.id !== updatedProject.id) {
          return item;
        }

        return {
          ...item,
          ...updatedProject,
        };
      }),
    };
  }),

  on(projectsActions.updateFromWSPartial, (state, { updatedProject }) => {
    return {
      ...state,
      projectsList: state.projectsList.map((item) => {
        if (item.id !== updatedProject.id) {
          return item;
        }
        return {
          ...item,
          ...updatedProject,
        } as ProjectEntity;
      }),
    };
  }),

  on(projectsActions.updateFilter, (state, { updateProjectFilter }) => ({
    ...state,
    projectFilter: { ...updateProjectFilter },
  }))
);
