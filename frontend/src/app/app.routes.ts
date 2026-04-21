import { Routes } from '@angular/router';
import { ContactPage } from './contact-page/contact-page';
import { Home } from './home/home';
import { Auth } from './auth/auth';
import { UserProfile } from './user-profile/user-profile';
<<<<<<< HEAD
import { Games } from './games/games';
=======
import { Leaderboard } from './leaderboard/leaderboard';
>>>>>>> bdefdbce4e4bd5d78f1996b379173250db28023b


export const routes: Routes = [
    {path: '', redirectTo: '/auth', pathMatch: 'full'},
    {path: 'home', component: Home },
    {path: 'auth', component: Auth },
    {path: 'games', component: Games},
    {path: 'contact-page', component: ContactPage },
    {path: 'user-profile', component: UserProfile },
    {path: 'leaderboard', component: Leaderboard }
];
