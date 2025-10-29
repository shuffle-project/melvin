import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LetDirective } from '@ngrx/component';
import { Subject } from 'rxjs';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { UploadProgress } from 'src/app/services/upload/upload.interfaces';

@Component({
  selector: 'app-upload-progress',
  imports: [
    MatProgressBarModule,
    MatIconModule,
    LetDirective,
    MatButtonModule,
    DecimalPipe,
    FileSizePipe,
  ],
  templateUrl: './upload-progress.component.html',
  styleUrl: './upload-progress.component.scss',
})
export class UploadProgressComponent implements OnInit {
  @Input() progress$!: Subject<UploadProgress>;
  @Input() title!: string;
  @Input() fileSize!: number;
  @Input() customInlinePadding = 1;

  constructor() {
    this.progress$ = new Subject();
  }

  ngOnInit() {}
}
