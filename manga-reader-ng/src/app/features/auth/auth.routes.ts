import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
];


