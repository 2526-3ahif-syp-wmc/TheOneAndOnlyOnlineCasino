import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../services/user-service';
import {
  GameHistory,
  LeaderboardDetails,
  LeaderboardService,
} from '../services/leaderboard-service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfile implements OnInit {
  private userService = inject(UserService);
  private leaderboardService = inject(LeaderboardService);
  protected router = inject(Router);

  private currentUser = this.userService.currentUser;

  protected username = computed(() => this.userService.username());
  protected profileInitial = computed(() => (this.username().charAt(0) || 'U').toUpperCase());
  protected balance = computed(() => this.userService.coins());

  protected leaderboardDetails = signal<LeaderboardDetails | null>(null);
  protected statsLoading = signal(false);
  protected statsError = signal('');

  totalGamesPlayed = computed(() => {
    return this.leaderboardDetails()?.stats.games_played ?? 0;
  });

  totalWins = computed(() => {
    return this.leaderboardDetails()?.stats.wins ?? 0;
  });

  totalLosses = computed(() => {
    return this.leaderboardDetails()?.stats.losses ?? 0;
  });

  totalCoinsWon = computed(() => {
    return this.leaderboardDetails()?.stats.coins_won ?? 0;
  });

  totalCoinsLost = computed(() => {
    return this.leaderboardDetails()?.stats.coins_lost ?? 0;
  });

  recentActivity = computed(() => {
    return this.leaderboardDetails()?.history.slice(0, 8) ?? [];
  });

  ngOnInit(): void {
    this.loadProfileStats();
  }

  private loadProfileStats(): void {
    const user = this.currentUser();

    if (!user) {
      this.statsError.set('You must be logged in to view profile stats.');
      return;
    }

    this.statsLoading.set(true);
    this.statsError.set('');

    this.leaderboardService.getPlayerDetails(user.id).subscribe({
      next: (details: LeaderboardDetails) => {
        this.leaderboardDetails.set(details);
        this.statsLoading.set(false);
      },
      error: (error) => {
        console.error('Could not load profile stats', error);
        this.statsError.set('Could not load profile stats.');
        this.statsLoading.set(false);
      },
    });
  }

  protected gameIcon(gameName: string): string {
    const normalized = gameName.toLowerCase();

    if (normalized.includes('roulette')) {
      return '●';
    }

    if (normalized.includes('slot')) {
      return '★';
    }

    if (normalized.includes('mine')) {
      return '◆';
    }

    return '♠';
  }

  protected activityText(game: GameHistory): string {
    if (game.result === 'win') {
      return `Won ${game.coins_won} coins`;
    }

    return `Lost ${game.coins_lost} coins`;
  }

  protected activityClass(game: GameHistory): string {
    return game.result === 'win' ? 'win' : 'loss';
  }

  logout(): void {
    this.userService.logOut();
    this.router.navigate(['/auth']);
  }

  formatPlayedAt(playedAt: string): string {
    const utcDate = new Date(playedAt.replace(' ', 'T') + 'Z');

    return utcDate.toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
