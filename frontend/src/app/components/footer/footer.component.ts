import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AppState } from '../../store/app.state';
import * as authSelectors from '../../store/selectors/auth.selector';
import { PushPipe } from '@ngrx/component';
import { LogoComponent } from '../logo/logo.component';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: true,
    imports: [
    MatButtonModule,
    RouterLink,
    LogoComponent,
    PushPipe
],
})
export class FooterComponent implements OnInit {
  public year = dayjs().format('YYYY');

  public showAdminControls$!: Observable<boolean>;

  constructor(private api: ApiService, private store: Store<AppState>) {}

  ngOnInit() {
    this.showAdminControls$ = this.store.select(authSelectors.selectIsLoggedIn);
  }

  async onPopulate() {
    this.api.populate().subscribe();
  }
}
