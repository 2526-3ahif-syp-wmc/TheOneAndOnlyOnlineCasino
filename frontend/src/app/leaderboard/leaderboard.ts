import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  LeaderboardDetails,
  LeaderboardEntry,
  LeaderboardService
} from '../services/leaderboard-service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss'
})
export class Leaderboard implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  selectedDetails?: LeaderboardDetails;

  loading = false;
  detailsLoading = false;
  errorMessage = '';

  constructor(
    private leaderboardService: LeaderboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.leaderboardService.getLeaderboard().subscribe({
      next: (players: LeaderboardEntry[]) => {
        console.log('Leaderboard loaded:', players);

        this.leaderboard = players;
        this.loading = false;
        this.cdr.detectChanges();

        if (players.length > 0) {
          this.selectPlayer(players[0]);
        }
      },
      error: (error) => {
        console.error('Leaderboard error:', error);

        this.errorMessage = 'Leaderboard could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectPlayer(player: LeaderboardEntry): void {
    this.detailsLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.leaderboardService.getPlayerDetails(player.id).subscribe({
      next: (details: LeaderboardDetails) => {
        console.log('Player details loaded:', details);

        details.stats.rank = player.rank;
        this.selectedDetails = details;
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Player details error:', error);

        this.errorMessage = 'Player details could not be loaded.';
        this.detailsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isSelected(player: LeaderboardEntry): boolean {
    return this.selectedDetails?.stats.id === player.id;
  }
}