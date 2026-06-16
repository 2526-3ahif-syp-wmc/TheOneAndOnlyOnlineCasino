import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BlackjackCardDto {
  suit: string;
  rank: string;
  value: number;
}

export interface BlackjackGameDto {
  id: number;
  userId: number;
  bet: number;
  status: string;
  playerHand: BlackjackCardDto[];
  dealerHand: BlackjackCardDto[];
}

@Injectable({
  providedIn: 'root',
})
export class BlackjackService {
  private apiUrl = 'http://localhost:3000/blackjack';

  constructor(private http: HttpClient) {}

  startGame(userId: number, bet: number): Observable<BlackjackGameDto> {
    return this.http.post<BlackjackGameDto>(`${this.apiUrl}/`, { userId, bet });
  }

  hit(gameId: number): Observable<BlackjackGameDto> {
    return this.http.post<BlackjackGameDto>(`${this.apiUrl}/${gameId}/hit`, {});
  }

  stand(gameId: number): Observable<BlackjackGameDto> {
    return this.http.post<BlackjackGameDto>(`${this.apiUrl}/${gameId}/stand`, {});
  }
}
