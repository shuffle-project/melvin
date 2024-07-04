import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ProjectEntity } from '../../services/api/entities/project.entity';
import { InviteCollaboratorsTabComponent } from './components/invite-collaborators-tab/invite-collaborators-tab.component';
import { SharePlayerTabComponent } from './components/share-player-tab/share-player-tab.component';

interface DialogData {
  project: ProjectEntity;
}

@Component({
  selector: 'app-share-project-dialog',
  templateUrl: './share-project-dialog.component.html',
  styleUrls: ['./share-project-dialog.component.scss'],
  imports: [
    MatDialogModule,
    MatTabsModule,
    MatIconModule,
    InviteCollaboratorsTabComponent,
    SharePlayerTabComponent,
    MatButtonModule,
  ],
  standalone: true,
})
export class ShareProjectDialogComponent {
  public project = inject<DialogData>(MAT_DIALOG_DATA).project;
}
