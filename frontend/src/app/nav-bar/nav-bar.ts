import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.scss'],
})
export class NavBar {
  private service = inject(UserService);

  private router = inject(Router);

  protected username = this.service.username;
  protected coins = this.service.coins;
  protected premium = this.service.premium;

  protected isPremium = computed(() => Number(this.premium()) === 1);

  logOut() {
    this.service.logOut();
    this.router.navigate(['/auth']);
  }
}
