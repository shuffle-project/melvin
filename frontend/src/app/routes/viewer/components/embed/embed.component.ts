import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertService } from '../../../../services/alert/alert.service';
import { ViewerComponent } from '../../viewer.component';

@Component({
  selector: 'app-embed',
  standalone: true,
  imports: [ViewerComponent, MatButtonModule],
  templateUrl: './embed.component.html',
  styleUrl: './embed.component.scss',
})
export class EmbedComponent implements OnInit {
  /**
   * <iframe width="560" height="315" src="https://www.youtube.com/embed/T6eK-2OQtew?si=T-rM8qzI35cyNfKq"
   *  title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media;
   * gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
   */

  @Input({ required: true }) public viewerLink!: string | undefined;

  width = 650;
  height = 400;
  title = 'Melvin player';

  url: string | undefined = undefined;
  iframeString: string | undefined = undefined;

  copied = false;

  constructor(
    private alert: AlertService,
    private domSanitizer: DomSanitizer,
    private clipboard: Clipboard
  ) {}

  ngOnInit() {
    this.url = this.viewerLink + '?embed=true';
    this.iframeString = `<iframe width="${this.width}" height="${this.height}" src="${this.url}" title="${this.title}" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" ></iframe>`;
  }

  onCopyToClipboard() {
    const success = this.clipboard.copy(this.iframeString!);
    if (success) {
      this.copied = true;
      this.alert.success('Copied to clipboard');
    }
  }

  getUrl() {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(this.url!);
  }
}
