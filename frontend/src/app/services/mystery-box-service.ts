import { Injectable, inject } from '@angular/core';
import { LeaderboardService } from './leaderboard-service';

export interface MysteryBoxReward {
  type: 'zero' | 'coins' | 'buff';
  amount: number; // for coins, this is the amount; for buff, not used
}

@Injectable({
  providedIn: 'root'
})
export class MysteryBoxService {
  private leaderboardService = inject(LeaderboardService);
  private readonly BUFF_DURATION_MS = 60 * 60 * 1000; // 1 hour (adjust as needed)
  private readonly BUFF_STORAGE_KEY = 'mystery-box-buff-expiry';

  /**
   * Get random reward based on probabilities:
   * 50% chance: 0 coins
   * 40% chance: 1-500 coins
   * 10% chance: buff (2x wins)
   */
  generateReward(): MysteryBoxReward {
    const random = Math.random();

    if (random < 0.5) {
      return { type: 'zero', amount: 0 };
    } else if (random < 0.9) {
      const coins = Math.floor(Math.random() * 500) + 1;
      return { type: 'coins', amount: coins };
    } else {
      return { type: 'buff', amount: 0 };
    }
  }

  /**
   * Activate the 2x wins buff for the configured duration
   */
  activateBuff(): void {
    const expiryTime = Date.now() + this.BUFF_DURATION_MS;
    localStorage.setItem(this.BUFF_STORAGE_KEY, expiryTime.toString());
  }

  /**
   * Check if the buff is currently active
   */
  isBuffActive(): boolean {
    const expiryTime = localStorage.getItem(this.BUFF_STORAGE_KEY);
    if (!expiryTime) {
      return false;
    }

    const expiry = parseInt(expiryTime, 10);
    const isActive = Date.now() < expiry;

    if (!isActive) {
      localStorage.removeItem(this.BUFF_STORAGE_KEY);
    }

    return isActive;
  }

  /**
   * Get the remaining time of the buff in milliseconds
   */
  getBuffRemainingTime(): number {
    const expiryTime = localStorage.getItem(this.BUFF_STORAGE_KEY);
    if (!expiryTime) {
      return 0;
    }

    const expiry = parseInt(expiryTime, 10);
    const remaining = expiry - Date.now();

    return remaining > 0 ? remaining : 0;
  }

  /**
   * Apply the buff to a game win by logging an additional win with 0 coins
   * This way the leaderboard counts it as 2 wins but doesn't double the money
   */
  applyBuffToWin(userId: number, gameName: string, betAmount: number): void {
    if (!this.isBuffActive()) {
      return;
    }

    // Save an additional win with 0 coins to represent the buff multiplier
    void this.leaderboardService
      .saveGameHistory({
        userId,
        gameName: `${gameName} (Buff)`,
        result: 'win',
        betAmount: 0,
        coinsWon: 0,
        coinsLost: 0
      })
      .subscribe({
        error: (error) => {
          console.error('Could not apply mystery box buff', error);
        }
      });
  }

  /**
   * Clear the buff (used when testing or for admin purposes)
   */
  clearBuff(): void {
    localStorage.removeItem(this.BUFF_STORAGE_KEY);
  }
}
