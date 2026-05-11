import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  userService = inject(UserService);
  protected router = inject(Router);

  private currentUser = this.userService.currentUser;

  totalGamesPlayed = computed(() => {
    const user = this.currentUser();

    return (user?.wins ?? 0) + (user?.losses ?? 0);
  });

  totalWins = computed(() => this.currentUser()?.wins ?? 0);

  winRate = computed(() => {
    const gamesPlayed = this.totalGamesPlayed();

    if (gamesPlayed === 0) {
      return 0;
    }

    return Math.round((this.totalWins() / gamesPlayed) * 100);
  });

  totalCoinsWon = computed(() => {
    const startingCoins = 1000;

    return Math.max(0, this.userService.coins() - startingCoins);
  });

  logout() {
    this.userService.logOut();
    this.router.navigate(['/auth'])
  }
}
