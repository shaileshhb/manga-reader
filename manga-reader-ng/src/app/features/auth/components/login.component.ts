import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-card">
        <h1>Login</h1>
        <p class="error" *ngIf="error()">{{ error() }}</p>
        <label>
          <span>Username</span>
          <input formControlName="username" autocomplete="username" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        <button type="submit" [disabled]="submitting()"> {{ submitting() ? 'Signing in…' : 'Sign in' }} </button>
      </form>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #171717;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #404040;
      color: #fff;
      display: grid;
      gap: 12px;
    }
    h1 { margin: 0 0 8px; font-size: 20px; }
    label { display: grid; gap: 6px; font-size: 12px; color: #d4d4d4; }
    input {
      padding: 10px 12px;
      background: #262626;
      color: #fff;
      border: 1px solid #404040;
      border-radius: 8px;
      outline: none;
    }
    button {
      padding: 10px 12px;
      background: #dc2626;
      color: #fff;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      opacity: 1;
    }
    button[disabled] { opacity: 0.7; cursor: default; }
    .error { color: #f87171; font-size: 12px; margin: 0; }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(AuthStore);

  submitting = signal(false);
  error = signal('');

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.store.isAuthenticated()) {
        this.router.navigate(['/manga']);
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const { username, password } = this.form.getRawValue();
      await this.auth.login({ username: String(username ?? ''), password: String(password ?? '') });
      this.router.navigate(['/manga']);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Login failed');
    } finally {
      this.submitting.set(false);
    }
  }
}


