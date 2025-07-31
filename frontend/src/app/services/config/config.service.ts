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
  MELVIN_SIGN_LANGUAGE_URL: string;
  MELVIN_EASY_LANGUAGE_URL: string;
  MELVIN_DISABLE_LANDING_PAGE: 'true' | 'false';
  MELVIN_DISABLE_TUTORIAL_VIDEOS: 'true' | 'false';
  MELVIN_DISABLE_INSTALLATION_PAGE: 'true' | 'false';
  MELVIN_CONTACT_EMAIL: string;
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
    return this._config.get('MELVIN_PRIVACY_URL') || '';
  }

  getImprintUrl(): string {
    return this._config.get('MELVIN_IMPRINT_URL') || '';
  }

  getBackendBaseUrl(): string {
    return this._config.get('MELVIN_BACKEND_BASE_URL') || '';
  }

  getFrontendBaseUrl(): string {
    return this._config.get('MELVIN_FRONTEND_BASE_URL') || '';
  }

  getAccessibilityStatementUrl(): string {
    return this._config.get('MELVIN_ACCESSIBILITY_STATEMENT_URL') || '';
  }

  getDisableLandingPage(): boolean {
    const disableLandingPage = this._config.get('MELVIN_DISABLE_LANDING_PAGE');

    return disableLandingPage ? disableLandingPage === 'true' : false;
  }

  getDisableTutorialVideos(): boolean {
    const disableTutorialVideos = this._config.get(
      'MELVIN_DISABLE_TUTORIAL_VIDEOS'
    );

    return disableTutorialVideos ? disableTutorialVideos === 'true' : true;
  }

  getContactEmail(): string {
    return this._config.get('MELVIN_CONTACT_EMAIL') || '';
  }

  getDisableInstallationPage(): boolean {
    const disableInstallationPage = this._config.get(
      'MELVIN_DISABLE_INSTALLATION_PAGE'
    );

    return disableInstallationPage ? disableInstallationPage === 'true' : true;
  }

  getSignLanguageUrl(): string {
    return this._config.get('MELVIN_SIGN_LANGUAGE_URL') || '';
  }

  getEasyLanguageUrl(): string {
    return this._config.get('MELVIN_EASY_LANGUAGE_URL') || '';
  }
}
