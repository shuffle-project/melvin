import { Component, OnInit } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HeaderComponent } from '../../../components/header/header.component';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import * as authSelectors from '../../../store/selectors/auth.selector';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [HeaderComponent, LetDirective, MatSelectModule],
})
export class ProfileComponent implements OnInit {
  user$!: Observable<AuthUser | null>;

  // language$ = this.store.select(configSelector.language);
  locale = $localize.locale;

  newNotifications$!: Observable<ReadonlyArray<Notification>>;
  oldNotifications$!: Observable<ReadonlyArray<Notification>>;

  constructor(private store: Store) {}

  onLanguageSwitched(event: MatSelectChange) {
    // TODO
    document.location.href = `${environment.frontendBaseUrl}/${event.value}/home/profile`;
  }

  ngOnInit() {
    this.user$ = this.store.select(authSelectors.selectUser);
  }

  getTime(timestamp: string) {
    return new Date(timestamp).getTime();
  }
}
