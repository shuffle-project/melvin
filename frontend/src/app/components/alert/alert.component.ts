import { Component, Input } from '@angular/core';

type AlertLevel = 'error' | 'success' | 'info' | 'default';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent {
  @Input() level: AlertLevel = 'default';

  constructor() {}
}
