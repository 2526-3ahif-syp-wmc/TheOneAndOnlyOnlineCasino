import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  userService = inject(UserService);

  totalGamesPlayed = 47;
  totalWins = 28;
  winRate = 59;
  totalCoinsWon = 2450;

  logout() {
    localStorage.removeItem('user');
    window.location.href = '/auth';
  }
}
