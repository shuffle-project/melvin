import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, map, take, tap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ApiService } from '../../../../../services/api/api.service';
import {
  ProjectEntity,
  ProjectStatus,
} from '../../../../../services/api/entities/project.entity';
import { AppState } from '../../../../../store/app.state';
import * as authSelectors from '../../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { MatButtonModule } from '@angular/material/button';
import { LetDirective, PushPipe } from '@ngrx/component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-user-test-controls',
    templateUrl: './user-test-controls.component.html',
    styleUrls: ['./user-test-controls.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        LetDirective,
        MatButtonModule,
        PushPipe,
    ],
})
export class UserTestControlsComponent implements OnInit {
  public show$ = this.store
    .select(authSelectors.selectUser)
    .pipe(map((user) => user?.name === 'Melvin'));

  public isLive: boolean = false;
  public project$ = this.store
    .select(editorSelectors.selectProject)
    .pipe(
      tap((project) => (this.isLive = project?.status === ProjectStatus.LIVE))
    );

  constructor(
    private store: Store<AppState>,
    private apiService: ApiService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {}

  async onClickStart() {
    const project = (await firstValueFrom(this.project$)) as ProjectEntity;
    this.apiService.userTestStart(project.id).pipe(take(1)).subscribe();
  }

  async onClickStop() {
    const project = (await firstValueFrom(this.project$)) as ProjectEntity;
    this.apiService.userTestStop(project.id).pipe(take(1)).subscribe();
  }

  async onClickReset() {
    const project = (await firstValueFrom(this.project$)) as ProjectEntity;
    this.apiService.userTestReset(project.id).pipe(take(1)).subscribe();
  }

  async onClickDownload() {
    const project = (await firstValueFrom(this.project$)) as ProjectEntity;

    this.httpClient
      .get(`${environment.baseRestApi}/user-test/download/${project.id}`, {
        responseType: 'blob' as 'json',
      })
      .pipe(take(1))
      .subscribe((data: any) => {
        const blob = new Blob([data], { type: 'application/json' });

        const downloadURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = `${project.title}.json`;
        link.click();
      });
  }
}
