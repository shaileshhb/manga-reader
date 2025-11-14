import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'manga' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'manga',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/manga/manga.routes').then((m) => m.MANGA_ROUTES),
  },
  {
    path: 'reader',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reader/reader.routes').then((m) => m.READER_ROUTES),
  },
  { path: '**', redirectTo: 'manga' },
];
