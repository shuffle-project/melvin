import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LetDirective } from '@ngrx/component';
import { Subject } from 'rxjs';

interface UploadProgress {
  value: number;
  bytesSent: number;
  bytesTotal: number;
  eta: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

@Component({
  selector: 'app-upload-progress',
  imports: [MatProgressBarModule, MatIconModule, LetDirective, MatButtonModule],
  templateUrl: './upload-progress.component.html',
  styleUrl: './upload-progress.component.scss',
})
export class UploadProgressComponent implements OnInit {
  @Input() progress$!: Subject<UploadProgress>;
  @Input() title!: string;
  @Input() fileIcon!: string;

  @Input() downloadLink?: string;

  constructor() {
    this.progress$ = new Subject();
  }

  async ngOnInit() {
    const stepDuration = 10;
    for (let i = 0; i < 100; i++) {
      this.progress$.next({
        value: i,
        bytesSent: i * 1000,
        bytesTotal: 100000,
        status: 'uploading',
        eta: ((stepDuration - i) * 1000) / stepDuration,
      });
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
    this.progress$.next({
      value: 1,
      bytesSent: 100000,
      bytesTotal: 100000,
      status: 'completed',
      eta: 0,
    });
    this.progress$.next({
      value: 1,
      bytesSent: 100000,
      bytesTotal: 100000,
      status: 'failed',
      eta: 0,
    });
  }
}
