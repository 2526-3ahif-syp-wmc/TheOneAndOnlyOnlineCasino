import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  private service = inject(AuthService);

  private router = inject(Router);

  public username = this.service.getUsername();
  
  logOut() {
    this.service.logOut();
    this.router.navigate(['/auth']);
  }
}
