import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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

  @ViewChild('avatarInput') private avatarInput!: ElementRef<HTMLInputElement>;

  protected avatarUrl = this.userService.avatarUrl;
  protected avatarPreview = signal<string | null>(null);
  protected avatarUploading = signal(false);
  protected avatarError = signal('');

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

  triggerAvatarUpload(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('Please choose an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
    this.avatarInput.nativeElement.value = '';
  }

  confirmAvatar(): void {
    const preview = this.avatarPreview();
    if (!preview) return;

    this.avatarUploading.set(true);
    this.avatarError.set('');

    this.userService.uploadAvatar(preview).subscribe({
      next: () => {
        this.avatarPreview.set(null);
        this.avatarUploading.set(false);
      },
      error: () => {
        this.avatarError.set('Upload failed. Please try again.');
        this.avatarUploading.set(false);
      },
    });
  }

  cancelAvatarPreview(): void {
    this.avatarPreview.set(null);
    this.avatarError.set('');
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