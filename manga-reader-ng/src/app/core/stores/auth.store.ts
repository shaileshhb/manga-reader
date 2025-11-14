import { Injectable, computed, effect, signal } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface User {
  id: string;
  name: string;
}

const STORAGE_KEYS = {
  AUTH_USER: 'auth:user',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userSig = signal<User | null>(null);

  readonly user = computed(() => this.userSig());
  readonly isAuthenticated = computed(() => !!this.userSig());

  constructor(private readonly storage: LocalStorageService) {
    const saved = this.storage.getItem<User>(STORAGE_KEYS.AUTH_USER);
    if (saved) {
      this.userSig.set(saved);
    }
    // Persist on change
    effect(() => {
      const value = this.userSig();
      if (value) {
        this.storage.setItem(STORAGE_KEYS.AUTH_USER, value);
      } else {
        this.storage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    });
  }

  setUser(user: User | null): void {
    this.userSig.set(user);
  }

  logout(): void {
    this.userSig.set(null);
  }
}


