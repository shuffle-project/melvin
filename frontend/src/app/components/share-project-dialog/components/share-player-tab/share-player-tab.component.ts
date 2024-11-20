import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { lastValueFrom, map, Observable } from 'rxjs';
import { AuthUser } from 'src/app/interfaces/auth.interfaces';
import { EmbedComponent } from 'src/app/routes/viewer/components/embed/embed.component';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { environment } from 'src/environments/environment';
import * as authSelectors from '../../../../store/selectors/auth.selector';

@Component({
    selector: 'app-share-player-tab',
    imports: [
        MatExpansionModule,
        MatIcon,
        EmbedComponent,
        MatButtonModule,
        PushPipe,
    ],
    templateUrl: './share-player-tab.component.html',
    styleUrl: './share-player-tab.component.scss'
})
export class SharePlayerTabComponent {
  @Input({ required: true }) project!: ProjectEntity;

  authUser$!: Observable<AuthUser | null>;

  // public viewerToken!: string;
  viewerToken = signal<string>('');
  viewerLink = computed(
    () => `${environment.frontendBaseUrl}/view/${this.viewerToken()}`
  );

  width = 650;
  height = 400;
  title = 'Melvin videoplayer';
  url: string | undefined = undefined;
  iframeString: string | undefined = undefined;

  constructor(
    private apiService: ApiService,
    private clipboard: Clipboard,
    private alertService: AlertService,
    private store: Store
  ) {
    this.authUser$ = this.store.select(authSelectors.selectUser);
  }

  ngOnInit() {
    this.viewerToken.set(this.project.viewerToken);

    this.iframeString = `<iframe width="${this.width}" 
        height="${this.height}" 
        src="${this.viewerLink()}?embed=true" 
        title="${this.title}" 
        frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" ></iframe>`;
  }

  // get viewerLink(): string {
  //   return `${environment.frontendBaseUrl}/view/${this.viewerToken()}`;
  // }

  onCopyToClipboard() {
    const success = this.clipboard.copy(this.iframeString!);
    if (success) {
      this.alertService.success(
        $localize`:@@sharePlayerCopiedToClipboardMessage:Copied to clipboard`
      );
    }
  }

  onClickCopyLink() {
    this.clipboard.copy(this.viewerLink());
    this.alertService.success(
      $localize`:@@sharePlayerLinkCopiedMessage:Link copied`
    );
  }

  async onClickUpdateViewer() {
    try {
      const newViewerToken = await lastValueFrom(
        this.apiService
          .updateProjectViewerToken(this.project.id)
          .pipe(map((o) => o.viewerToken))
      );
      this.viewerToken.set(newViewerToken);

      this.alertService.success(
        $localize`:@@sharePlayerNewLinkMessage:New link generated`
      );
    } catch (err: unknown) {
      console.error(err);
    }
  }
}
