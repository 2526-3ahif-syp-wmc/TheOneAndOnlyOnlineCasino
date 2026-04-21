import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBar } from "./nav-bar/nav-bar";
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  showNavbar = true;

  constructor(private router: Router) {
    this.updateNavbar(this.router.url);

    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateNavbar(this.router.url);
      });
  }

  private updateNavbar(url: string): void {
    this.showNavbar = !url.includes('/auth');
  }
}
