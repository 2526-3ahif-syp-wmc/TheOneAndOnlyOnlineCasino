import { Routes } from '@angular/router';
import { ContactPage } from './contact-page/contact-page';
import { Home } from './home/home';
import { Auth } from './auth/auth';
import { UserProfile } from './user-profile/user-profile';


export const routes: Routes = [
    {path: '', redirectTo: '/auth', pathMatch: 'full'},
    {path: 'home', component: Home },
    {path: 'auth', component: Auth },
    {path: 'contact', component: ContactPage },
    {path: 'user-profile', component: UserProfile }
];
