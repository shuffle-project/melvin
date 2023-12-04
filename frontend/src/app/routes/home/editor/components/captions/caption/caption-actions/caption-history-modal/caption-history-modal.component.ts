import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DIFF_DELETE, DIFF_INSERT, diff_match_patch } from 'diff-match-patch';
import { ApiService } from '../../../../../../../../services/api/api.service';
import {
  CaptionEntity,
  CaptionHistoryEntity,
} from '../../../../../../../../services/api/entities/caption.entity';


interface HistoryItem {
  html: SafeHtml;
  text: string;
  updatedAt: Date;
}

@Component({
    selector: 'app-caption-history-modal',
    templateUrl: './caption-history-modal.component.html',
    styleUrls: ['./caption-history-modal.component.scss'],
    standalone: true,
    imports: [
    MatDialogTitle
],
})
export class CaptionHistoryModalComponent implements OnInit {
  public displayedColumns = ['text', /*'createdBy',*/ 'createdAt'];
  public loading = true;
  public historyEntries!: CaptionHistoryEntity[];

  public items!: HistoryItem[];

  private dmp = new diff_match_patch();

  constructor(
    public dialogRef: MatDialogRef<CaptionHistoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { caption: CaptionEntity },
    private api: ApiService,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.api.getCaptionHistory(this.data.caption.id).subscribe((entries) => {
      this._generateItems(entries);
      this.loading = false;
    });
  }

  _generateItems(entries: CaptionHistoryEntity[]) {
    const allEntries = [
      ...entries,
      {
        updatedAt: this.data.caption.updatedAt,
        text: this.data.caption.text,
      },
    ];

    this.items = [];

    for (let i = 0; i < allEntries.length; i++) {
      const entry = allEntries[i];
      let html: SafeHtml;

      if (i === 0) {
        html = this.domSanitizer.bypassSecurityTrustHtml(entry.text);
      } else {
        const diffs = this.dmp.diff_main(
          allEntries[i - 1].text,
          allEntries[i].text
        );

        this.dmp.diff_cleanupSemantic(diffs);

        const unsafeHtml = diffs
          .map(([change, value]) => {
            switch (change) {
              case DIFF_DELETE:
                return `<del>${value}</del>`;
              case DIFF_INSERT:
                return `<ins>${value}</ins>`;
              default:
                return `<span>${value}</span>`;
            }
          })
          .join('');

        html = this.domSanitizer.bypassSecurityTrustHtml(unsafeHtml);
      }

      this.items.push({
        updatedAt: new Date(),
        text: entry.text,
        html,
      });
    }
  }
}
