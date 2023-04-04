import { Injectable } from '@angular/core';
import { StorageKey } from './storage-key.enum';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  private _parseFromStorage<T>(value: any, defaultValue: any = null): T | null {
    if (value === null) {
      return defaultValue;
    }
    try {
      return JSON.parse(value);
    } catch (err) {
      return defaultValue;
    }
  }

  storeInSessionStorage(key: StorageKey, value: any) {
    sessionStorage.setItem(key.toString(), JSON.stringify(value));
  }

  getFromSessionStorage<T>(
    key: StorageKey,
    defaultValue: T | null = null
  ): T | null {
    const value = sessionStorage.getItem(key.toString());
    return this._parseFromStorage<T>(value, defaultValue);
  }

  existsInSessionStorage(key: StorageKey): boolean {
    return sessionStorage.getItem(key) !== null;
  }

  removeFromSessionStorage(key: StorageKey): void {
    sessionStorage.removeItem(key.toString());
  }

  storeInLocalStorage(key: StorageKey, value: any) {
    localStorage.setItem(key.toString(), JSON.stringify(value));
  }

  getFromLocalStorage<T>(
    key: StorageKey,
    defaultValue: T | null = null
  ): T | null {
    const value = localStorage.getItem(key.toString());
    return this._parseFromStorage<T>(value, defaultValue);
  }

  existsInLocalStorage(key: StorageKey): boolean {
    return localStorage.getItem(key) !== null;
  }

  removeFromLocalStorage(key: StorageKey): void {
    localStorage.removeItem(key.toString());
  }

  getFromSessionOrLocalStorage<T>(
    key: StorageKey,
    defaultValue: T | null = null
  ): T | null {
    return (
      this.getFromSessionStorage(key, defaultValue) ??
      this.getFromLocalStorage(key, defaultValue)
    );
  }

  removeFromSessionAndLocalStorage(key: StorageKey): void {
    this.removeFromSessionStorage(key);
    this.removeFromLocalStorage(key);
  }
}
