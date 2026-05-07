import { Routes } from '@angular/router';
import { ContactPage } from './contact-page/contact-page';
import { Home } from './home/home';
import { Auth } from './auth/auth';
import { UserProfile } from './user-profile/user-profile';
import { UserEditPage } from './user-edit-page/user-edit-page';
import { Games } from './games/games';
import { Leaderboard } from './leaderboard/leaderboard';
import { Shop } from './shop/shop';
import { authGuard, guestGuard } from '../auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'auth', component: Auth, canActivate: [guestGuard] },

  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'games', component: Games, canActivate: [authGuard] },
  { path: 'contact-page', component: ContactPage, canActivate: [authGuard] },
  { path: 'user-profile', component: UserProfile, canActivate: [authGuard] },
  { path: 'user-edit-page', component: UserEditPage, canActivate: [authGuard] },
  { path: 'leaderboard', component: Leaderboard, canActivate: [authGuard] },
  { path: 'shop', component: Shop, canActivate: [authGuard] },
  {path : 'games/roulette', loadComponent: () => import('./roulette-game/roulette-game').then(m => m.RouletteComponent), canActivate: [authGuard]},
  {path : 'games/mines', loadComponent: () => import('./mines-game/mines-game').then(m => m.MinesComponent), canActivate: [authGuard]},
  { path: '**', redirectTo: 'home' }
];