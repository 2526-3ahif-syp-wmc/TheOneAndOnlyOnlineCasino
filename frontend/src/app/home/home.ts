import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../services/alert-service';

interface GameTile {
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  players: number;
  coverImage: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  private service = inject(UserService);
  private alertService = inject(AlertService);

  protected username = this.service.username;
  protected coins = this.service.coins;
  protected xp = this.service.xp;
  protected level = this.service.level;
  protected xpProgress = this.service.xpProgress;
  protected xpNeeded = this.service.xpNeeded;
  protected xpPercent = this.service.xpPercent;

  protected dailyBonusAmount = 1000;

  private today = new Date().toISOString().slice(0, 10);

  private bonusStorageKey = computed(() => {
    return `daily-bonus-${this.username()}`;
  });

  protected lastClaimedDay = signal(
    localStorage.getItem(this.bonusStorageKey()) ?? ''
  );

  protected readonly games: GameTile[] = [
    {
      title: 'Mines',
      subtitle: 'Risk every tile',
      badge: 'Hot',
      icon: '✦',
      players: 94,
      coverImage: '/mines.jpeg',
      route: '/games/mines',
    },
    {
      title: 'Slot Machine',
      subtitle: 'Spin for coins',
      badge: 'Fast',
      icon: '★',
      players: 211,
      coverImage: '/slot-mashine.jpeg',
      route: '/games/slotmachine',
    },
    {
      title: 'Roulette',
      subtitle: 'Follow the wheel',
      badge: 'Classic',
      icon: '●',
      players: 76,
      coverImage: '/roulette.jpeg',
      route: '/games/roulette',
    },
  ];

  protected canClaimDailyBonus = computed(() => {
    return this.lastClaimedDay() !== this.today;
  });

  protected async claimDailyBonus(): Promise<void> {
    if (!this.canClaimDailyBonus()) {
      return;
    }

    try {
      await firstValueFrom(
        this.service.updateCoins(this.coins() + this.dailyBonusAmount)
      );

      this.alertService.info(`+${this.dailyBonusAmount} EC`);
      localStorage.setItem(this.bonusStorageKey(), this.today);
      this.lastClaimedDay.set(this.today);
    } catch (err) {
      console.error(err);
      this.alertService.error('Claiming daily bonus failed');
    }
  }
}