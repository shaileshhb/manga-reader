import { Injectable } from '@angular/core';

const DEFAULT_NAMESPACE = 'manga-reader';

function buildKey(key: string, namespace: string = DEFAULT_NAMESPACE): string {
  return `${namespace}:${key}`;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  setItem<T>(key: string, value: T, namespace?: string): void {
    try {
      const storageKey = buildKey(key, namespace);
      const serialized = JSON.stringify(value);
      localStorage.setItem(storageKey, serialized);
    } catch {
      // ignore
    }
  }

  getItem<T>(key: string, namespace?: string): T | null {
    try {
      const storageKey = buildKey(key, namespace);
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  removeItem(key: string, namespace?: string): void {
    try {
      const storageKey = buildKey(key, namespace);
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  clearNamespace(namespace: string = DEFAULT_NAMESPACE): void {
    try {
      const prefix = `${namespace}:`;
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(prefix)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  }
}


