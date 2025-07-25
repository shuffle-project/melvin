import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-tutorial',
  imports: [MatTabsModule, MatIconModule, RouterLink, MatExpansionModule],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
})
export class TutorialComponent {
  disableTutorialVideos = this.configService.getDisableTutorialVideos();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigService
  ) {}
}
