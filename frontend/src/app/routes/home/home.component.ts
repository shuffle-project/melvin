import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { CustomLogger } from '../../classes/logger.class';
import { WSService } from '../../services/ws/ws.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [RouterOutlet]
})
export class HomeComponent implements OnInit, OnDestroy {
  private logger = new CustomLogger('HOME COMPONENT');

  constructor(private ws: WSService, private store: Store) {}

  async ngOnInit() {
    await this.ws.connect();
  }

  async ngOnDestroy() {
    await this.ws.disconnect();
  }
}
