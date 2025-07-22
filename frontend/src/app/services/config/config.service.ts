import { Injectable } from '@angular/core';

declare global {
  interface Window {
    env: WindowEnvConfig;
  }
}

interface WindowEnvConfig {
  MELVIN_IMPRINT_URL: string;
  MELVIN_PRIVACY_URL: string;
  MELVIN_DE_IMPRINT_URL: string;
  MELVIN_DE_PRIVACY_URL: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  // private _config = new Map([
  //   ['imprintUrl', 'MELVIN_IMPRINT_URL'],
  //   ['deImprintUrl', 'MELVIN_DE_IMPRINT_URL'],
  //   ['privacyUrl', 'MELVIN_PRIVACY_URL'],
  //   ['dePrivacyUrl', 'MELVIN_DE_PRIVACY_URL'],
  // ]);

  constructor() {
    const env = window['env'] || {};
    console.log('- v v v -');
    console.log(env);
  }

  // get config() {
  //   return this._config;
  // }
}
