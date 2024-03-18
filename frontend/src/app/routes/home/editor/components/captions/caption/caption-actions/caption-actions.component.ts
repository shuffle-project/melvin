import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { FeatureEnabledPipe } from '../../../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import {
  CaptionEntity,
  CaptionStatusEnum,
} from '../../../../../../../services/api/entities/caption.entity';
import * as captionsActions from '../../../../../../../store/actions/captions.actions';
import { AppState } from '../../../../../../../store/app.state';
import { CaptionHistoryModalComponent } from './caption-history-modal/caption-history-modal.component';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeleteConfirmationService } from '../../../../../../../components/delete-confirmation-dialog/delete-confirmation.service';

@Component({
  selector: 'app-caption-actions',
  templateUrl: './caption-actions.component.html',
  styleUrls: ['./caption-actions.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    FeatureEnabledPipe,
  ],
})
export class CaptionActionsComponent implements OnInit {
  @Input() caption!: CaptionEntity;
  @Input() isFocused!: boolean;

  get isFlagged(): boolean {
    return this.caption?.status === CaptionStatusEnum.FLAGGED;
  }

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private deleteService: DeleteConfirmationService
  ) {}

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
    this.deleteService.deleteCaption(this.caption);
  }
}
