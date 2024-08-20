import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';
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
  ],
  templateUrl: './landing-header.component.html',
  styleUrl: './landing-header.component.scss',
})
export class LandingHeaderComponent {
  @Output() toggleSidebar = new EventEmitter();

  constructor(private dialog: MatDialog) {}

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
}
