import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../../../services/alert/alert.service';
import { ViewerComponent } from '../../viewer.component';

@Component({
  selector: 'app-embed',
  standalone: true,
  imports: [ViewerComponent, MatButtonModule],
  templateUrl: './embed.component.html',
  styleUrl: './embed.component.scss',
})
export class EmbedComponent {
  /**
   * <iframe width="560" height="315" src="https://www.youtube.com/embed/T6eK-2OQtew?si=T-rM8qzI35cyNfKq"
   *  title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media;
   * gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
   */

  width = 650;
  height = 400;
  url =
    'http://localhost:4200/view/t6KP55AcAXj1BtWHGF95EGhqfuvJaryVlknHMs9PWZmoASWy50tljgCKdgXC6c2m?embed=true';
  title = 'embedded video';

  iframeString = `<iframe width="${this.width}" height="${this.height}" src="${this.url}" title="${this.title}" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" ></iframe>`;

  copied = false;

  constructor(private alert: AlertService) {}

  onCopyToClipboard() {
    navigator.clipboard.writeText(this.iframeString).then(() => {
      this.copied = true;
      this.alert.success('Copied to clipboard');
    });
  }
}
