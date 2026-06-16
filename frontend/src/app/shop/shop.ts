import { Component, computed, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../services/alert-service';

type CoinPack = {
  coins: number;
  price: number;
  badge: string;
  title: string;
  description: string;
  popular?: boolean;
};

@Component({
  selector: 'app-shop',
  imports: [],
  templateUrl: './shop.html',
  styleUrls: ['./shop.scss'],
})
export class Shop {
  private service = inject(UserService);
  private alertService = inject(AlertService);

  protected isPremium = computed(() => this.service.premium() === 1);
  protected discountAvailable = !this.checkUsedDiscountToday();

  private checkUsedDiscountToday(): boolean {
    return localStorage.getItem('premiumDiscountDate') === new Date().toDateString();
  }

  private markDiscountUsed(): void {
    localStorage.setItem('premiumDiscountDate', new Date().toDateString());
    this.discountAvailable = false;
  }

  protected getDisplayPrice(price: number): string {
    if (this.isPremium() && this.discountAvailable) {
      return (price * 0.8).toFixed(2);
    }
    return price.toFixed(2);
  }

  protected coinPacks: CoinPack[] = [
    {
      coins: 500,
      price: 3.99,
      badge: 'Starter',
      title: '500 Coins',
      description: 'Perfect for a small session.',
    },
    {
      coins: 1000,
      price: 8.99,
      badge: 'Popular',
      title: '1000 Coins',
      description: 'Best pick for regular players.',
      popular: true,
    },
    {
      coins: 5000,
      price: 44.99,
      badge: 'Value',
      title: '5000 Coins',
      description: 'A strong pack for longer play.',
    },
    {
      coins: 10000,
      price: 89.99,
      badge: 'High Roller',
      title: '10000 Coins',
      description: 'Maximum balance for serious players.',
    },
  ];

  protected async buyCoins(pack: CoinPack) {
    const currentCoins = this.service.currentUser()?.coins ?? 0;
    const isDiscounted = this.isPremium() && this.discountAvailable;
    const finalPrice = isDiscounted ? +(pack.price * 0.8).toFixed(2) : pack.price;

    try {
      await firstValueFrom(this.service.updateCoins(currentCoins + pack.coins));
      if (isDiscounted) this.markDiscountUsed();
      const msg = isDiscounted
        ? `You bought ${pack.coins} Coins for ${finalPrice.toFixed(2)}€ (20% EduBet+ discount applied!)`
        : `You bought ${pack.coins} Coins for ${pack.price.toFixed(2)}€`;
      this.alertService.info(msg);
    } catch (err) {
      console.log(err);
      this.alertService.error('Buying coins failed');
    }
  }

  protected async buyCustomCoins(value: string) {
    const coins = Number(value);

    if (!coins || coins <= 0) {
      this.alertService.error('Please enter a valid coin amount');
      return;
    }

    const basePrice = coins / 100;
    const isDiscounted = this.isPremium() && this.discountAvailable;
    const finalPrice = isDiscounted ? +(basePrice * 0.8).toFixed(2) : basePrice;
    const currentCoins = this.service.currentUser()?.coins ?? 0;

    try {
      await firstValueFrom(this.service.updateCoins(currentCoins + coins));
      if (isDiscounted) this.markDiscountUsed();
      const msg = isDiscounted
        ? `You bought ${coins} Coins for ${finalPrice.toFixed(2)}€ (20% EduBet+ discount applied!)`
        : `You bought ${coins} Coins for ${basePrice.toFixed(2)}€`;
      this.alertService.info(msg);
    } catch (err) {
      console.log(err);
      this.alertService.error('Buying custom coins failed');
    }
  }

  protected async buySubscription() {
    if (this.service.premium() === 1) {
      this.alertService.info('You already own Edubet+ Subscription!');
      return;
    }

    try {
      await firstValueFrom(this.service.buyPremium());

      this.alertService.info('You bought EduBet+ Subscription for 9.99€ per month');
    } catch (err) {
      console.log(err);
      this.alertService.error('Buying EduBet+ failed');
    }
  }

  protected getNormalPrice(coins: number) {
    return (coins / 100).toFixed(2);
  }
}
