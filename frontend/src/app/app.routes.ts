import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Partidos } from './pages/partidos/partidos';
import { MisPredicciones } from './pages/mispredicciones/mispredicciones';
import { Ranking } from './pages/ranking/ranking';
import { Reglas } from './pages/reglas/reglas';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login',    component: Login },
  { path: 'register', component: Register },

  // Rutas protegidas: requieren sesión válida
  { path: '',                component: Home,            canActivate: [authGuard] },
  { path: 'partidos',        component: Partidos,        canActivate: [authGuard] },
  { path: 'mispredicciones', component: MisPredicciones, canActivate: [authGuard] },
  { path: 'ranking',         component: Ranking,         canActivate: [authGuard] },
  { path: 'reglas',          component: Reglas },

  { path: '**', redirectTo: '' }
];