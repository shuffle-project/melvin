import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import * as viewerActions from '../../store/actions/viewer.actions';
import { AppState } from '../../store/app.state';
import { ViewerComponent } from './viewer/viewer.component';

@Component({
  selector: 'app-viewer-wrapper',
  standalone: true,
  imports: [ViewerComponent],
  templateUrl: './viewer-wrapper.component.html',
  styleUrl: './viewer-wrapper.component.scss',
})
export class ViewerWrapperComponent implements OnInit {
  constructor(private route: ActivatedRoute, private store: Store<AppState>) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];
    this.store.dispatch(viewerActions.viewerLogin({ token }));
  }
}
