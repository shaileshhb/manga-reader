import { Injectable, inject } from '@angular/core';
import { AuthStore, User } from '../../../core/stores/auth.store';

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(AuthStore);

  async login(credentials: LoginCredentials): Promise<User> {
    // Placeholder: mirror React's fake login
    const user: User = { id: 'local', name: credentials.username || 'User' };
    this.store.setUser(user);
    return user;
  }

  logout(): void {
    this.store.logout();
  }
}


