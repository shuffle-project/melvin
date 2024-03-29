import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss'],
    standalone: true,
})
export class LogoComponent {
  @Input() size: number = 36;

  constructor() {}
}
