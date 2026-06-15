import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user-service';
import { MysteryBoxService } from '../services/mystery-box-service';
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
  private mysteryBoxService = inject(MysteryBoxService);

  protected username = this.service.username;
  protected coins = this.service.coins;
  protected xp = this.service.xp;
  protected level = this.service.level;
  protected xpProgress = this.service.xpProgress;
  protected xpNeeded = this.service.xpNeeded;
  protected xpPercent = this.service.xpPercent;

  protected dailyBonusAmount = 1000;
  private readonly MYSTERY_BOX_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

  private today = new Date().toISOString().slice(0, 10);

  private bonusStorageKey = computed(() => {
    return `daily-bonus-${this.username()}`;
  });

  private mysteryBoxStorageKey = computed(() => {
    return `mystery-box-${this.username()}`;
  });

  protected lastClaimedDay = signal(
    localStorage.getItem(this.bonusStorageKey()) ?? ''
  );

  protected lastClaimedMysteryBox = signal(
    localStorage.getItem(this.mysteryBoxStorageKey()) ?? ''
  );

  constructor() {}

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

  protected canClaimMysteryBox = computed(() => {
    const lastClaimStr = this.lastClaimedMysteryBox();
    if (!lastClaimStr) {
      return true;
    }

    const lastClaimTime = parseInt(lastClaimStr, 10);
    const now = Date.now();
    return now - lastClaimTime >= this.MYSTERY_BOX_COOLDOWN_MS;
  });

  protected timeUntilNextMysteryBox = computed(() => {
    const lastClaimStr = this.lastClaimedMysteryBox();
    if (!lastClaimStr) {
      return 0;
    }

    const lastClaimTime = parseInt(lastClaimStr, 10);
    const now = Date.now();
    const timePassed = now - lastClaimTime;
    const timeRemaining = this.MYSTERY_BOX_COOLDOWN_MS - timePassed;

    if (timeRemaining <= 0) {
      return 0;
    }

    return Math.ceil(timeRemaining / (60 * 60 * 1000)); // Convert to hours
  });

  protected async claimMysteryBox(): Promise<void> {
    if (!this.canClaimMysteryBox()) {
      return;
    }

    try {
      const reward = this.mysteryBoxService.generateReward();
      const now = Date.now();

      if (reward.type === 'zero') {
        this.alertService.info('Mystery Box: Nothing this time!');
      } else if (reward.type === 'coins') {
        await firstValueFrom(
          this.service.updateCoins(this.coins() + reward.amount)
        );
        this.alertService.info(`Mystery Box: +${reward.amount} EC!`);
      } else if (reward.type === 'buff') {
        this.mysteryBoxService.activateBuff();
        this.alertService.info('Mystery Box: 2x Wins Buff activated for 1 hour!');
      }

      localStorage.setItem(this.mysteryBoxStorageKey(), now.toString());
      this.lastClaimedMysteryBox.set(now.toString());
    } catch (err) {
      console.error(err);
      this.alertService.error('Claiming mystery box failed');
    }
  }