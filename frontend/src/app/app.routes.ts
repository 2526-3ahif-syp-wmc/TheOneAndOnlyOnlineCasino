import { Routes } from '@angular/router';
import { ContactPage } from './contact-page/contact-page';
import { Home } from './home/home';
import { SignIn } from './sign-in/sign-in';


export const routes: Routes = [
    {path: '', redirectTo: '/sign-in', pathMatch: 'full'},
    {path: 'home', component: Home },
    {path: 'sign-in', component: SignIn },
    {path: 'contact-page', component: ContactPage }
];
