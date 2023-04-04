import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ICONS } from './constants/icon.constants';
import { AppService } from './services/app/app.service';
import * as authActions from './store/actions/auth.actions';
import { AppState } from './store/app.state';
import * as authSelectors from './store/selectors/auth.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public isInitialized$: Observable<boolean>;

  constructor(
    private domSanitizer: DomSanitizer,
    private matIconRegistry: MatIconRegistry,
    private store: Store<AppState>,
    private appService: AppService
  ) {
    this.registerIcons();

    this.isInitialized$ = this.store.select(authSelectors.selectInitialized);
  }

  ngOnInit(): void {
    this.store.dispatch(authActions.init());
    this.appService.init();
  }

  private registerIcons() {
    ICONS.map((o) =>
      this.matIconRegistry.addSvgIcon(
        o,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          `assets/icons/${o}.svg`
        )
      )
    );
  }
}
