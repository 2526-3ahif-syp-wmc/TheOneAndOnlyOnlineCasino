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

  protected profileInitial = computed(() => {
    return (this.username().charAt(0) || 'E').toUpperCase();
  });

  protected dailyBonusAmount = 1000;
  private readonly MYSTERY_BOX_COOLDOWN_MS = 6 * 60 * 60 * 1000;

  private today = new Date().toISOString().slice(0, 10);

  private bonusStorageKey = computed(() => {
    return `daily-bonus-${this.username()}`;
  });

  private mysteryBoxStorageKey = computed(() => {
    return `mystery-box-${this.username()}`;
  });

  protected lastClaimedDay = signal(localStorage.getItem(this.bonusStorageKey()) ?? '');

  protected lastClaimedMysteryBox = signal(localStorage.getItem(this.mysteryBoxStorageKey()) ?? '');

  protected mysteryRevealOpen = signal(false);
  protected mysteryRevealExplode = signal(false);
  protected mysteryRevealReward = signal('❓');
  protected mysteryRevealScale = signal(1);

  private mysteryVisualRewards = ['❌', '🪙', '⭐'];

  protected readonly games: GameTile[] = [
    {
      title: 'Mines',
      subtitle: 'Reveal tiles, avoid bombs, cash out in time.',
      badge: 'Risk',
      icon: '✦',
      players: 94,
      coverImage: '/mines.jpeg',
      route: '/games/mines',
    },
    {
      title: 'Slot Machine',
      subtitle: 'Spin reels, hit lines, try the 2x gamble.',
      badge: 'Fast',
      icon: '★',
      players: 211,
      coverImage: '/slot-mashine.jpeg',
      route: '/games/slotmachine',
    },
    {
      title: 'Roulette',
      subtitle: 'Pick your color, number or section.',
      badge: 'Lucky',
      icon: '●',
      players: 76,
      coverImage: '/roulette.jpeg',
      route: '/games/roulette',
    },
    {
      title: 'Plinko',
      subtitle: 'Drop the ball and chase huge multipliers.',
      badge: 'New',
      icon: '◆',
      players: 128,
      coverImage: '/plinko.jpeg',
      route: '/games/plinko',
    },
  ];

  protected canClaimDailyBonus = computed(() => {
    return this.lastClaimedDay() !== this.today;
  });

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

    return Math.ceil(timeRemaining / (60 * 60 * 1000));
  });

  protected scrollToGames(): void {
    const gameLobby = document.getElementById('game-lobby');

    if (!gameLobby) {
      return;
    }

    gameLobby.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected async claimDailyBonus(): Promise<void> {
    if (!this.canClaimDailyBonus()) {
      return;
    }

    try {
      await firstValueFrom(this.service.updateCoins(this.coins() + this.dailyBonusAmount));

      this.alertService.info(`+${this.dailyBonusAmount} EC`);
      localStorage.setItem(this.bonusStorageKey(), this.today);
      this.lastClaimedDay.set(this.today);
    } catch (err) {
      console.error(err);
      this.alertService.error('Claiming daily bonus failed');
    }
  }

  protected async claimMysteryBox(): Promise<void> {
    if (!this.canClaimMysteryBox()) {
      return;
    }

    try {
      const reward = this.mysteryBoxService.generateReward();

      const finalReward = reward.type === 'zero' ? '❌' : reward.type === 'coins' ? '🪙' : '⭐';

      await this.playMysteryReveal(finalReward);

      const now = Date.now();

      if (reward.type === 'zero') {
        this.alertService.info('Mystery Box: Nothing this time!');
      } else if (reward.type === 'coins') {
        await firstValueFrom(this.service.updateCoins(this.coins() + reward.amount));

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

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private async playMysteryReveal(finalReward: string): Promise<void> {
    this.mysteryRevealOpen.set(true);
    this.mysteryRevealExplode.set(false);

    const start = performance.now();
    const duration = 3800;

    while (performance.now() - start < duration) {
      const progress = (performance.now() - start) / duration;
      const delay = 45 + progress * 260;

      this.mysteryRevealScale.set(1 + progress * 1.6);
      this.mysteryRevealReward.set(
        this.mysteryVisualRewards[Math.floor(Math.random() * this.mysteryVisualRewards.length)],
      );

      await this.wait(delay);
    }

    this.mysteryRevealReward.set(finalReward);
    this.mysteryRevealExplode.set(true);

    await this.wait(1000);

    this.mysteryRevealOpen.set(false);
    this.mysteryRevealExplode.set(false);
    this.mysteryRevealScale.set(1);
  }
}
