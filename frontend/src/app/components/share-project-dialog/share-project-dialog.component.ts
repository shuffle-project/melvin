import { Clipboard } from '@angular/cdk/clipboard';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { lastValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { USERS_MOCK } from '../../constants/mocks/users.mock';
import { AlertService } from '../../services/alert/alert.service';
import { ApiService } from '../../services/api/api.service';
import { ProjectEntity } from '../../services/api/entities/project.entity';

interface DialogData {
  project: ProjectEntity;
}

@Component({
  selector: 'app-share-project-dialog',
  templateUrl: './share-project-dialog.component.html',
  styleUrls: ['./share-project-dialog.component.scss'],
})
export class ShareProjectDialogComponent implements OnInit {
  public project: ProjectEntity;
  public inviteToken!: string;
  public isLoading!: boolean;
  public error!: string | null;

  public users = USERS_MOCK;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DialogData,
    private apiService: ApiService,
    private clipboard: Clipboard,
    private alertService: AlertService
  ) {
    this.project = data.project;
  }

  get inviteLink(): string {
    return `${environment.frontendBaseUrl}/invite/${this.inviteToken}`;
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      this.inviteToken = await lastValueFrom(
        this.apiService
          .getProjectInviteToken(this.project.id)
          .pipe(map((o) => o.inviteToken))
      );
    } catch (err: unknown) {
      this.error = (err as HttpErrorResponse).message;
    } finally {
      this.isLoading = false;
    }
  }

  onClickCopyLink() {
    this.clipboard.copy(this.inviteLink);
    this.alertService.success(
      $localize`:@@shareProjectLinkCopiedMessage:Link copied`
    );
  }

  async onClickUpdate() {
    try {
      this.inviteToken = await lastValueFrom(
        this.apiService
          .updateProjectInviteToken(this.project.id)
          .pipe(map((o) => o.inviteToken))
      );
    } catch (err: unknown) {
      console.error(err);
    }
  }
}
