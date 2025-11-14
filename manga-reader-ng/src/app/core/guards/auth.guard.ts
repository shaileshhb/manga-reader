import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

// Temporary guard until AuthStore is implemented.
// Checks presence of saved user in localStorage.
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  try {
    const raw = localStorage.getItem('manga-reader:auth:user');
    if (raw) return true;
  } catch {
    // ignore
  }
  router.navigate(['/auth/login']);
  return false;
};


