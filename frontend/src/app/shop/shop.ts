import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';

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
  styleUrl: './shop.scss'
})
export class Shop {
  private service = inject(UserService);

  protected coinPacks: CoinPack[] = [
    {
      coins: 500,
      price: 3.99,
      badge: 'Starter',
      title: '500 Coins',
      description: 'Perfect for a small session.'
    },
    {
      coins: 1000,
      price: 8.99,
      badge: 'Popular',
      title: '1000 Coins',
      description: 'Best pick for regular players.',
      popular: true
    },
    {
      coins: 5000,
      price: 44.99,
      badge: 'Value',
      title: '5000 Coins',
      description: 'A strong pack for longer play.'
    },
    {
      coins: 10000,
      price: 89.99,
      badge: 'High Roller',
      title: '10000 Coins',
      description: 'Maximum balance for serious players.'
    }
  ];

  protected async buyCoins(pack: CoinPack) {
    alert(`You bought ${pack.coins} Coins for ${pack.price.toFixed(2)}€`);

    const currentCoins = this.service.currentUser()?.coins ?? 0;

    await firstValueFrom(this.service.updateCoins(currentCoins + pack.coins ));
  }

  protected buySubscription() {
    alert('You bought EduBet+ Subscription for 10.00€ per month');
  }

  protected getNormalPrice(coins: number) {
    return (coins / 100).toFixed(2);
  }
}