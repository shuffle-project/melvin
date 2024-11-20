import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

type AlertLevel = 'error' | 'success' | 'info' | 'default';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    imports: [NgClass]
})
export class AlertComponent {
  @Input() level: AlertLevel = 'default';

  constructor() {}
}
