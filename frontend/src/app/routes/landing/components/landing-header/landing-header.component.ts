import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { ColorTheme } from 'src/app/store/reducers/config.reducer';
import * as configActions from '../../../../store/actions/config.actions';
import * as configSelector from '../../../../store/selectors/config.selector';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
@Component({
  selector: 'app-landing-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    LogoComponent,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    LetDirective,
  ],
  templateUrl: './landing-header.component.html',
  styleUrl: './landing-header.component.scss',
})
export class LandingHeaderComponent {
  @Output() toggleSidebar = new EventEmitter();

  public colorThemeENUM = ColorTheme;
  public colorTheme$ = this.store.select(configSelector.colorTheme);

  constructor(private dialog: MatDialog, private store: Store) {
    this.colorTheme$.subscribe((colorTheme) => {
      console.log('colorTheme', colorTheme);
    });
  }

  onOpenLoginDialog() {
    this.dialog.open(LoginDialogComponent, {
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
    });
  }

  onToggleSidebar() {
    this.toggleSidebar.emit(true);
  }

  onChangeColorTheme(colorTheme: ColorTheme) {
    this.store.dispatch(configActions.changeColorTheme({ colorTheme }));
  }
}
