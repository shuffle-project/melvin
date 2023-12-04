import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { AlertComponent } from '../../../../components/alert/alert.component';
import { ProjectStatusPipe } from '../../../../pipes/project-status-pipe/project-status.pipe';
import { ApiService } from '../../../../services/api/api.service';
import { UpdateProjectDto } from '../../../../services/api/dto/update-project.dto';
import {
  ProjectEntity,
  ProjectStatus,
} from '../../../../services/api/entities/project.entity';

import { LetDirective } from '@ngrx/component';

interface ProjectGeneralComponentState {
  isLoading: boolean;
  project: ProjectEntity | null;
  isPending: boolean;
  error: string | null;
  message: string | null;
}

const initialState: ProjectGeneralComponentState = {
  project: null,
  isLoading: false,
  isPending: false,
  error: null,
  message: null,
};

@Component({
  selector: 'app-project-general',
  templateUrl: './project-general.component.html',
  styleUrls: ['./project-general.component.scss'],
  standalone: true,
  imports: [
    LetDirective,
    MatProgressSpinnerModule,
    AlertComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    ProjectStatusPipe
],
})
export class ProjectGeneralComponent extends ComponentStore<ProjectGeneralComponentState> {
  private _projectId!: string;

  @Input()
  set projectId(value: string) {
    this._projectId = value;
    this.fetchProject(value);
  }

  get projectId(): string {
    return this._projectId;
  }

  public formGroup: FormGroup = this.fb.group({
    title: new FormControl<String>('', Validators.required),
    status: new FormControl<ProjectStatus>(
      ProjectStatus.DRAFT,
      Validators.required
    ),
  });

  public statuses = Object.values(ProjectStatus);

  public isLoading$ = this.select((state) => state.isLoading);
  public isPending$ = this.select((state) => state.isPending);
  public message$ = this.select((state) => state.message);
  public error$ = this.select((state) => state.error);

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    super(initialState);
  }

  readonly setLoading = this.updater((state, isLoading: boolean) => ({
    ...state,
    isLoading,
    error: null,
    message: null,
  }));

  readonly setPending = this.updater((state, isPending: boolean) => ({
    ...state,
    isPending,
    error: null,
    message: null,
  }));

  readonly setError = this.updater((state, error: string) => ({
    ...state,
    isPending: false,
    error,
  }));

  readonly setMessage = this.updater((state, message: string) => ({
    ...state,
    isPending: false,
    message,
  }));

  readonly setProject = this.updater((state, project: ProjectEntity) => ({
    ...state,
    isLoading: false,
    project,
  }));

  readonly fetchProject = this.effect((projectId$: Observable<string>) =>
    projectId$.pipe(
      tap(() => this.setLoading(true)),
      // 👇 Handle race condition with the proper choice of the flattening operator.
      switchMap((id) =>
        this.apiService.findOneProject(id).pipe(
          //👇 Act on the result within inner pipe.
          tapResponse(
            (project: ProjectEntity) => {
              this.setProject(project);
              this.formGroup.get('title')?.setValue(project.title);
              this.formGroup.get('status')?.setValue(project.status);
              if (
                [ProjectStatus.DRAFT, ProjectStatus.FINISHED].includes(
                  project.status
                )
              ) {
                this.formGroup.get('status')?.enable();
              } else {
                this.formGroup.get('status')?.disable();
              }
            },
            (error: HttpErrorResponse) => this.setError(error.message)
          )
        )
      )
    )
  );

  readonly updateProject = this.effect(
    (origin$: Observable<{ projectId: string; dto: UpdateProjectDto }>) =>
      origin$.pipe(
        tap(() => this.setPending(true)),
        switchMap(({ projectId, dto }) =>
          this.apiService.updateProject(projectId, dto).pipe(
            //👇 Act on the result within inner pipe.
            tapResponse(
              () => {
                this.setMessage('Successfully updated project');
              },
              (error: HttpErrorResponse) => {
                this.setError(error.message);
              }
            )
          )
        )
      )
  );

  isStatusSelectable(status: ProjectStatus): boolean {
    return [ProjectStatus.DRAFT, ProjectStatus.FINISHED].includes(status);
  }

  onSubmit(): void {
    this.updateProject({
      projectId: this.projectId,
      dto: this.formGroup.value,
    });
  }
}
