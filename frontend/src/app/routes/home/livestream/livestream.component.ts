import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../services/api/api.service';
import { WSService } from '../../../services/ws/ws.service';
import { LivestreamService } from './livestream.service';

@Component({
    selector: 'app-livestream',
    templateUrl: './livestream.component.html',
    styleUrls: ['./livestream.component.scss'],
    standalone: true,
})
export class LivestreamComponent implements OnInit {
  @ViewChild('clientVideo') clientVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('serverVideo') serverVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private apiService: ApiService,
    protected livestreamService: LivestreamService,
    private ws: WSService
  ) {}

  ngOnInit(): void {}

  connect() {
    this.livestreamService.connect(
      '6200e98c9f6b0de828dbe34a',
      this.serverVideo
    );
  }
}
