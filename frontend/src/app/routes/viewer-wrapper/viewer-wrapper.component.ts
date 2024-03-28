import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { viewerLogin } from '../../store/actions/viewer.actions';
import { AppState } from '../../store/app.state';

@Component({
  selector: 'app-viewer-wrapper',
  standalone: true,
  imports: [],
  templateUrl: './viewer-wrapper.component.html',
  styleUrl: './viewer-wrapper.component.scss',
})
export class ViewerWrapperComponent implements OnInit {
  constructor(private route: ActivatedRoute, private store: Store<AppState>) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];
    this.store.dispatch(viewerLogin({ token }));
  }
}
