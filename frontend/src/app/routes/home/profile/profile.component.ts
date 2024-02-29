import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HeaderComponent } from '../../../components/header/header.component';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import { changeLanguage } from '../../../store/actions/config.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';
import * as configSelector from '../../../store/selectors/config.selector';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [HeaderComponent, LetDirective, MatSelectModule],
})
export class ProfileComponent implements OnInit {
  user$!: Observable<AuthUser | null>;

  language$ = this.store.select(configSelector.language);

  newNotifications$!: Observable<ReadonlyArray<Notification>>;
  oldNotifications$!: Observable<ReadonlyArray<Notification>>;

  constructor(private store: Store, private router: Router) {}

  onLanguageSwitched(event: MatSelectChange) {
    console.log(this.router.url);
    this.store.dispatch(changeLanguage({ language: event.value }));

    if (environment.production) {
      // in prod, change language via url and this will change the store value automatically
      // this.router.url.
    } else {
      //in dev, change language directly
      this.store.dispatch(changeLanguage({ language: event.value }));
    }
  }

  ngOnInit() {
    this.user$ = this.store.select(authSelectors.selectUser);
  }

  getTime(timestamp: string) {
    return new Date(timestamp).getTime();
  }
}
