import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  private service = inject(UserService);

  private router = inject(Router);

  protected username = this.service.username;
  protected coins = this.service.coins;
  
  logOut() {
    this.service.logOut();
    this.router.navigate(['/auth']);
  }
}
