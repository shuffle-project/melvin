import { Component, Input, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
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

@Component({
  selector: 'app-caption-actions',
  templateUrl: './caption-actions.component.html',
  styleUrls: ['./caption-actions.component.scss'],
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
