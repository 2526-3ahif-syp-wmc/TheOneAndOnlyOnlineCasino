import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../services/user-service';

interface LeaderboardEntry {
  id: number;
  username: string;
  coins: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgClass, DecimalPipe, FormsModule],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.scss']
})
export class Leaderboard implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_RATE = 5000; // 5 seconds
  private readonly TOP_LIMIT = 10;

  selectedWinsPeriod = 'today';
  selectedLossesPeriod = 'today';
  topWinsRaw = signal<LeaderboardEntry[]>([]);
  topLossesRaw = signal<LeaderboardEntry[]>([]);
  topPlayersRaw = signal<LeaderboardEntry[]>([]);

  topWins = computed(() => this.limitTop(this.sortByCoinsDesc(this.topWinsRaw())));
  topLosses = computed(() => this.limitTop(this.sortByCoinsAsc(this.topLossesRaw())));
  topPlayers = computed(() => this.limitTop(this.sortByCoinsDesc(this.topPlayersRaw())));

  periods = [
    { value: 'today', label: 'Today' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'all', label: 'All Time' }
  ];

  ngOnInit() {
    this.loadLeaderboard();
    this.startLiveUpdates();
  }

  ngOnDestroy() {
    this.stopLiveUpdates();
  }

  startLiveUpdates() {
    this.refreshInterval = setInterval(() => {
      this.loadLeaderboard();
    }, this.REFRESH_RATE);
  }

  stopLiveUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  loadLeaderboard() {
    this.userService.getLeaderboard('wins', this.selectedWinsPeriod).subscribe({
      next: (users) => this.topWinsRaw.set(users),
      error: (err) => console.error('Error loading wins leaderboard', err)
    });

    this.userService.getLeaderboard('losses', this.selectedLossesPeriod).subscribe({
      next: (users) => this.topLossesRaw.set(users),
      error: (err) => console.error('Error loading losses leaderboard', err)
    });

    this.userService.getTopPlayers().subscribe({
      next: (users) => this.topPlayersRaw.set(users),
      error: (err) => console.error('Error loading top players', err)
    });
  }

  onWinsPeriodChange(period: string) {
    this.selectedWinsPeriod = period;
    this.userService.getLeaderboard('wins', period).subscribe({
      next: (users) => this.topWinsRaw.set(users),
      error: (err) => console.error('Error loading wins leaderboard', err)
    });
  }

  onLossesPeriodChange(period: string) {
    this.selectedLossesPeriod = period;
    this.userService.getLeaderboard('losses', period).subscribe({
      next: (users) => this.topLossesRaw.set(users),
      error: (err) => console.error('Error loading losses leaderboard', err)
    });
  }

  limitTop(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return entries.slice(0, this.TOP_LIMIT);
  }

  // Sorting methods
  sortByCoinsAsc(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort((a, b) => a.coins - b.coins);
  }

  sortByCoinsDesc(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort((a, b) => b.coins - a.coins);
  }

  sortByUsernameAsc(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort((a, b) => a.username.localeCompare(b.username));
  }

  sortByUsernameDesc(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort((a, b) => b.username.localeCompare(a.username));
  }
}
