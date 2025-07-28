import { Injectable } from '@angular/core';

declare global {
  interface Window {
    env: WindowEnvConfig;
  }
}

interface WindowEnvConfig {
  MELVIN_BACKEND_BASE_URL: string;
  MELVIN_FRONTEND_BASE_URL: string;
  MELVIN_ACCESSIBILITY_STATEMENT_URL: string;
  MELVIN_IMPRINT_URL: string;
  MELVIN_PRIVACY_URL: string;
  MELVIN_DISABLE_LANDING_PAGE: 'true' | 'false';
  MELVIN_DISABLE_TUTORIAL_VIDEOS: 'true' | 'false';
}

export type EnvConfigKeys = keyof WindowEnvConfig;

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private _config: Map<EnvConfigKeys, string> = new Map();

  constructor() {
    const env = window['env'] || {};

    Array.from(Object.entries(env)).forEach(([key, value]) => {
      if (key in env) {
        this._config.set(key as EnvConfigKeys, value as string);
      }
    });
  }

  getPrivacyUrl(): string {
    return (this._config.get('MELVIN_PRIVACY_URL') as string) || '';
  }

  getImprintUrl(): string {
    return (this._config.get('MELVIN_IMPRINT_URL') as string) || '';
  }

  getBackendBaseUrl(): string {
    return (this._config.get('MELVIN_BACKEND_BASE_URL') as string) || '';
  }

  getFrontendBaseUrl(): string {
    return (this._config.get('MELVIN_FRONTEND_BASE_URL') as string) || '';
  }

  getAccessibilityStatementUrl(): string {
    return (
      (this._config.get('MELVIN_ACCESSIBILITY_STATEMENT_URL') as string) || ''
    );
  }

  getDisableLandingPage(): boolean {
    return this._config.get('MELVIN_DISABLE_LANDING_PAGE') === 'true' || false;
  }

  getDisableTutorialVideos(): boolean {
    return (
      this._config.get('MELVIN_DISABLE_TUTORIAL_VIDEOS') === 'true' || false
    );
  }
}
