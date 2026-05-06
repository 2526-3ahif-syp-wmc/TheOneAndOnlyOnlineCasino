import { Component, inject } from '@angular/core';
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

  totalGamesPlayed = 47;
  totalWins = 28;
  winRate = 59;
  totalCoinsWon = 2450;

  logout() {
    this.userService.logOut();
    this.router.navigate(['/auth'])
  }

  unsubscribe() {
    try {
      this.userService.unsubscribeEduBet().subscribe({
        next: () => {
          // simple UI feedback: reload to reflect new state
          window.location.reload();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Failed to unsubscribe';
          alert(msg);
        }
      });
    } catch (e) {
      alert('Unable to unsubscribe');
    }
  }
}
