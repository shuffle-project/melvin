import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { ProjectListEntity } from '../../services/api/entities/project-list.entity';
import * as editorActions from '../actions/editor.actions';
import * as projectsActions from '../actions/projects.actions';
import { AppState } from '../app.state';
import * as editorSelectors from '../selectors/editor.selector';
@Injectable({
  providedIn: 'root',
})
export class ProjectEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private alert: AlertService,
    private store: Store<AppState>,
    private router: Router
  ) {}

  fetchProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(projectsActions.findAll),
      mergeMap(() =>
        this.api.findAllProjects().pipe(
          map((projectListEntity: ProjectListEntity) => {
            return projectsActions.findAllSuccess({ projectListEntity });
          }),
          catchError((errorRes) =>
            // TODO Add reducer that listens
            of(projectsActions.findAllFail({ error: errorRes }))
          )
        )
      )
    )
  );

  findOneProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(projectsActions.findOne),
      switchMap((action) =>
        this.api.findOneProject(action.projectId).pipe(
          map((project) =>
            projectsActions.findOneSuccess({ project: project })
          ),
          catchError((errorRes) =>
            // TODO Add reducer that listens
            of(projectsActions.findOneFail({ error: errorRes }))
          )
        )
      )
    )
  );

  removeProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(projectsActions.remove),
      mergeMap((action) =>
        this.api.removeProject(action.removeProjectId).pipe(
          map(() =>
            projectsActions.removeSuccess({
              removedProjectId: action.removeProjectId,
            })
          ),
          catchError((errorRes) =>
            // TODO Add reducer that listens
            of(projectsActions.removeFail({ error: errorRes }))
          )
        )
      )
    )
  );

  updateProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        projectsActions.updateFromEditor,
        projectsActions.updateFromProjectList,
        projectsActions.updateProjectFromLiveControls
      ),
      mergeMap((action) =>
        this.api
          .updateProject(action.updateProject.id, action.updateProject)
          .pipe(
            map((updatedProject) => {
              return projectsActions.updateSuccess({
                updatedProject,
              });
            }),
            catchError((errorRes) =>
              // TODO Add reducer that listens
              of(projectsActions.updateFail({ error: errorRes }))
            )
          )
      )
    )
  );

  kickUserFromActiveProject$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectsActions.removeFromWS),
        withLatestFrom(this.store.select(editorSelectors.selectProject)),
        tap(([action, selectedProject]) => {
          if (action.removedProjectId === selectedProject?.id) {
            this.router.navigate(['/home/projects']);
            this.store.dispatch(editorActions.resetEditorState());
            this.alert.error(
              $localize`:@@projectEffectKickUserFromProject:The opened project was deleted.`
            );
          }
        })
      ),
    { dispatch: false }
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          projectsActions.findAllFail,
          projectsActions.removeFail,
          projectsActions.updateFail,
          projectsActions.findOneFail
        ),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );
}
