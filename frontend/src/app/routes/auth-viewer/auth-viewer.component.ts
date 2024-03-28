import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { lastValueFrom, map } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { loginSuccess } from '../../store/actions/auth.actions';
import { AppState } from '../../store/app.state';
import { ViewerComponent } from '../home/viewer/viewer.component';

@Component({
  selector: 'app-auth-viewer',
  templateUrl: './auth-viewer.component.html',
  styleUrls: ['./auth-viewer.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    ViewerComponent,
  ],
})
export class AuthViewerComponent implements OnInit {
  loading = true;
  projectId: string = '';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private store: Store<AppState>
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.params['token'];

    try {
      const res = await lastValueFrom(
        this.api.viewerLogin(token).pipe(map((o) => o))
      );

      this.store.dispatch(loginSuccess({ token: res.token }));
      // this.router.navigate(['/home/viewer', res.projectId]);

      console.log(res);
      this.projectId = res.projectId;
      this.loading = false;
    } catch (err: unknown) {
      console.log(err);
    }
  }
}
