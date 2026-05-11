import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../services/alert-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private service = inject(UserService);
  private alertService = inject(AlertService);

  protected username = this.service.username;
  protected coins = this.service.coins;

  protected dailyBonusAmount = 1000;

  private today = new Date().toISOString().slice(0, 10);

  private bonusStorageKey = computed(() => {
    return `daily-bonus-${this.username()}`;
  });

  protected lastClaimedDay = signal(
    localStorage.getItem(this.bonusStorageKey()) ?? ''
  );

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

      this.alertService.info(`You claimed today's daily bonus!`);
    } catch (err) {
      console.log(err);
      this.alertService.error('Claiming daily bonus failed');
    }

    localStorage.setItem(this.bonusStorageKey(), this.today);
    this.lastClaimedDay.set(this.today);
  }
}