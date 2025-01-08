import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { AppState } from '../../../../../store/app.state';
import * as authSelector from '../../../../../store/selectors/auth.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import { LivestreamService } from '../../../livestream/livestream.service';

@Component({
    selector: 'app-join-livestream-modal',
    templateUrl: './join-livestream-modal.component.html',
    styleUrls: ['./join-livestream-modal.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        LetDirective,
    ]
})
export class JoinLivestreamModalComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<JoinLivestreamModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { livestreamStarted: boolean; projectId: string },
    private router: Router,
    private store: Store<AppState>,
    private livestreamService: LivestreamService
  ) {}

  public isOwner$ = combineLatest([
    this.store.select(authSelector.selectUserId),
    this.store.select(editorSelector.selectProject),
  ]).pipe(map(([userId, project]) => userId === project?.createdBy.id));

  ngOnInit(): void {}

  onConfirm() {
    this.dialogRef.close();
  }

  onBack() {
    this.router.navigate(['/home/projects']);
    this.dialogRef.close();
  }

  onStartLivestream() {
    this.livestreamService.start(this.data.projectId);
    this.dialogRef.close();
  }
}
