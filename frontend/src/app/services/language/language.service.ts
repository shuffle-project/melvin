import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as configselectors from '../../store/selectors/config.selector';
import { Language } from '../api/entities/config.entity';

@Injectable({
  providedIn: 'root',
})
export class LanguageService implements OnDestroy {
  private destroy$$ = new Subject<void>();
  private locale = $localize.locale;
  private allLanguages!: Language[];

  private englishMap: Map<string, string> = new Map();
  private germanMap: Map<string, string> = new Map();

  constructor(private store: Store<AppState>) {
    this.store
      .select(configselectors.languagesConfig)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((languages) => {
        this.allLanguages = languages;
        languages.forEach((l) => {
          this.englishMap.set(l.code, l.englishName);
          this.germanMap.set(l.code, l.germanName);
        });
      });
  }

  getLocalizedLanguages() {
    const languages = this.allLanguages.map((l) => {
      return this.locale?.startsWith('en')
        ? { code: l.code, name: l.englishName }
        : { code: l.code, name: l.germanName };
    });

    if (this.locale?.startsWith('en')) {
      return languages;
    } else {
      return languages.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  getLocalizedLanguage(code: string) {
    if (this.locale?.startsWith('en')) {
      return this.englishMap.get(code) || code;
    } else {
      return this.germanMap.get(code) || code;
    }
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
