import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DailyGameOfDay {
  gameName: string;
  bonusPercent: number;
  selectedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameOfDayService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/game-of-day';

  public getGameOfDay(): Observable<DailyGameOfDay> {
    return this.httpClient.get<DailyGameOfDay>(this.apiUrl);
  }
}
