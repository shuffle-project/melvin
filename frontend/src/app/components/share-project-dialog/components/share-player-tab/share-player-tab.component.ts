import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { lastValueFrom, map } from 'rxjs';
import { EmbedComponent } from 'src/app/routes/viewer/components/embed/embed.component';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-share-player-tab',
  standalone: true,
  imports: [MatExpansionModule, MatIcon, EmbedComponent],
  templateUrl: './share-player-tab.component.html',
  styleUrl: './share-player-tab.component.scss',
})
export class SharePlayerTabComponent {
  @Input({ required: true }) project!: ProjectEntity;

  public viewerToken!: string;

  constructor(
    private apiService: ApiService,
    private clipboard: Clipboard,
    private alertService: AlertService
  ) {}

  get viewerLink(): string {
    return `${environment.frontendBaseUrl}/view/${this.project.viewerToken}`;
  }

  onClickCopyLink(link: string) {
    this.clipboard.copy(link);
    this.alertService.success(
      $localize`:@@shareProjectLinkCopiedMessage:Link copied`
    );
  }

  async onClickUpdateViewer() {
    try {
      this.viewerToken = await lastValueFrom(
        this.apiService
          .updateProjectViewerToken(this.project.id)
          .pipe(map((o) => o.viewerToken))
      );
    } catch (err: unknown) {
      console.error(err);
    }
  }
}
