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
    return this._config.get('MELVIN_BACKEND_BASE_URL')!;
  }

  getFrontendBaseUrl(): string {
    return this._config.get('MELVIN_FRONTEND_BASE_URL')!;
  }

  getAccessibilityStatementUrl(): string {
    return this._config.get('MELVIN_ACCESSIBILITY_STATEMENT_URL') || '';
  }
}
