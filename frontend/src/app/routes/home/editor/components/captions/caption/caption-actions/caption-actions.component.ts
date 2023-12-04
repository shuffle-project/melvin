import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import {
  CaptionEntity,
  CaptionStatusEnum,
} from '../../../../../../../services/api/entities/caption.entity';
import * as captionsActions from '../../../../../../../store/actions/captions.actions';
import { AppState } from '../../../../../../../store/app.state';
import {
  CaptionDeleteConfirmModalComponent,
  CaptionDeleteConfirmModalResult,
} from './caption-delete-confirm-modal/caption-delete-confirm-modal.component';
import { CaptionHistoryModalComponent } from './caption-history-modal/caption-history-modal.component';
import { FeatureEnabledPipe } from '../../../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-caption-actions',
    templateUrl: './caption-actions.component.html',
    styleUrls: ['./caption-actions.component.scss'],
    standalone: true,
    imports: [
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    FeatureEnabledPipe
],
})
export class CaptionActionsComponent implements OnInit {
  @Input() caption!: CaptionEntity;
  @Input() isFocused!: boolean;

  get isFlagged(): boolean {
    return this.caption?.status === CaptionStatusEnum.FLAGGED;
  }

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {}

  onToggleFlag() {
    const status =
      this.caption.status === CaptionStatusEnum.FLAGGED
        ? null
        : CaptionStatusEnum.FLAGGED;

    this.store.dispatch(
      captionsActions.update({
        id: this.caption.id,
        updateDto: { status },
      })
    );
  }

  onClickHistory() {
    this.dialog.open(CaptionHistoryModalComponent, {
      data: { caption: this.caption },
      width: '900px',
      maxHeight: '80vh',
    });
  }

  onClickDelete() {
    const dialogRef = this.dialog.open(CaptionDeleteConfirmModalComponent, {
      data: { caption: this.caption },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((data: CaptionDeleteConfirmModalResult) => {
        if (data?.delete) {
          this.store.dispatch(
            captionsActions.remove({ removeCaptionId: this.caption.id })
          );
        }
      });
  }
}
