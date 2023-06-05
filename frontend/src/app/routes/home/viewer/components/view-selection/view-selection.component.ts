import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';

@Component({
  selector: 'app-view-selection',
  templateUrl: './view-selection.component.html',
  styleUrls: ['./view-selection.component.scss'],
})
export class ViewSelectionComponent {
  @Input({ required: true }) project!: ProjectEntity | null;

  constructor(private store: Store<AppState>) {}

  onClickAdditionalVideo(index: number) {
    this.store.dispatch(
      viewerActions.changeAdditionalVideo({ choosenAdditionalVideo: index })
    );
  }
}
