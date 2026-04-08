import { Routes } from '@angular/router';
import { ContactPage } from './contact-page/contact-page';
import { Home } from './home/home';


export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'home', component: Home },
    {path: 'contact', component: ContactPage }
];
