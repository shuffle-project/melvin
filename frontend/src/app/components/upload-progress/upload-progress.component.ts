import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LetDirective } from '@ngrx/component';
import { Subject } from 'rxjs';
import { UploadProgress } from 'src/app/services/upload/upload.interfaces';

function toCorrectSizeUnit(n: number) {
  const ONE_KB = 1000;
  const ONE_MB = 1000 * 1000;
  const ONE_GB = ONE_MB * 1000;

  if (n >= ONE_GB) {
    return `${(n / ONE_GB).toFixed(2)} GB`;
  } else if (n >= ONE_MB) {
    return `${(n / ONE_MB).toFixed(2)} MB`;
  } else {
    return `${(n / ONE_KB).toFixed(2)} KB`;
  }
}

@Component({
  selector: 'app-upload-progress',
  imports: [
    MatProgressBarModule,
    MatIconModule,
    LetDirective,
    MatButtonModule,
    DecimalPipe,
  ],
  templateUrl: './upload-progress.component.html',
  styleUrl: './upload-progress.component.scss',
})
export class UploadProgressComponent implements OnInit {
  @Input() progress$!: Subject<UploadProgress>;
  @Input() title!: string;
  @Input({ transform: toCorrectSizeUnit }) fileSize!: string;
  @Input() customInlinePadding = 1;

  constructor() {
    this.progress$ = new Subject();
  }

  ngOnInit() {
    // const stepDuration = 10;
    // for (let i = 0; i < 100; i++) {
    //   this.progress$.next({
    //     progress: i,
    //     bytesSent: i * 1000,
    //     bytesTotal: 100000,
    //     status: 'uploading',
    //     eta: ((stepDuration - i) * 1000) / stepDuration,
    //   });
    //   await new Promise((resolve) => setTimeout(resolve, stepDuration));
    // }
    // this.progress$.next({
    //   value: 1,
    //   bytesSent: 100000,
    //   bytesTotal: 100000,
    //   status: 'completed',
    //   eta: 0,
    // });
    // this.progress$.next({
    //   value: 1,
    //   bytesSent: 100000,
    //   bytesTotal: 100000,
    //   status: 'failed',
    //   eta: 0,
    // });
  }
}
