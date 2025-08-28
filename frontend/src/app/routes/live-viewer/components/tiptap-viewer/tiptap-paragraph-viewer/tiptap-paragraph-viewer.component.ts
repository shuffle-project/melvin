import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AngularNodeViewComponent, NgxTiptapModule } from 'ngx-tiptap';

@Component({
  selector: 'app-tiptap-paragraph',
  imports: [
    NgxTiptapModule,
    MatMenuModule,
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './tiptap-paragraph-viewer.component.html',
  styleUrl: './tiptap-paragraph-viewer.component.scss',
})
export class TiptapParagraphViewerComponent extends AngularNodeViewComponent {
  constructor() {
    super();
  }
}
