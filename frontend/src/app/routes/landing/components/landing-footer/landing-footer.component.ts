import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-landing-footer',
  imports: [LogoComponent, RouterLink, MatIconModule, FeatureEnabledPipe],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent {
  locale = $localize.locale;
  footerConfigMap!: Map<string, string>;

  constructor(private api: ApiService, private configService: ConfigService) {
    // TODO: Es reicht nicht aus zu checken, ob es eine URL ist.
    // TODO: Darüber hinaus prüfen, ob das unsere Melvin Instanz ist? Oder eine zusätzliche Variable?
    // TODO: Reicht es aus nur einen Link anzugeben, für ein deutschen Impressum? Wenn man dazu noch eine englische Version braucht
    // TODO: Zum Beispiel haben wir beim Accessibility Statement zwei Versionen
    // TODO: Wird ein Warning im Terminal überhaupt angezeigt, wenn man docker compose mit "detach" startet?
    // TODO: Variablen in .env speichern und dann in docker-compose.yml referenzieren?
    // this.footerConfigMap = new Map(
    //   Object.entries(environment.deployConfig.footer)
    // );
    // this.footerConfigMap.forEach((value, key) => {
    //   try {
    //     new URL(value);
    //   } catch (_) {
    //     this.footerConfigMap.delete(key);
    //     console.warn(
    //       `${key}: Invalid URL "${value}". Check your docker-compose.yml `
    //     );
    //   }
    // });
  }

  async onPopulate() {
    this.api.populate().subscribe();
  }
}
