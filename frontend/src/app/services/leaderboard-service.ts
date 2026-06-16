import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type GameResult = 'win' | 'loss';

export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  games_played: number;
  wins: number;
  losses: number;
  coins_won: number;
  coins_lost: number;
  premium?: number;
}

export interface GameHistory {
  id: number;
  user_id: number;
  game_name: string;
  result: GameResult;
  bet_amount: number;
  coins_won: number;
  coins_lost: number;
  played_at: string;
}

export interface LeaderboardDetails {
  stats: LeaderboardEntry;
  history: GameHistory[];
}

export interface CreateGameHistoryDto {
  userId: number;
  gameName: string;
  result: GameResult;
  betAmount: number;
  coinsWon: number;
  coinsLost: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private apiUrl = 'http://localhost:3000/leaderboard';

  constructor(private http: HttpClient) {}

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(this.apiUrl);
  }

  getPlayerDetails(userId: number): Observable<LeaderboardDetails> {
    return this.http.get<LeaderboardDetails>(`${this.apiUrl}/${userId}`);
  }

  saveGameHistory(data: CreateGameHistoryDto): Observable<GameHistory> {
    return this.http.post<GameHistory>(`${this.apiUrl}/game-history`, data);
  }
}
