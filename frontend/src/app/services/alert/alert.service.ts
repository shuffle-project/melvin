import { Injectable } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Alert } from './alert.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private snackBar: MatSnackBar) {}

  private show(alert: Alert) {
    this.snackBar.open(alert.message, 'Ok', {
      duration: alert.level === 'error' ? undefined : 2000,
      panelClass: alert.level,
    });
  }

  info(message: string) {
    this.show({ level: 'info', message });
  }

  success(message: string) {
    this.show({ level: 'success', message });
  }

  error(message: string) {
    this.show({ level: 'error', message });
  }
}
