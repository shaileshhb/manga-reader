import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/login']);
  return false;
};


