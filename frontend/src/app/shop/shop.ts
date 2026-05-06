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
    const currentCoins = this.service.currentUser()?.coins ?? 0;

    try {
      await firstValueFrom(
        this.service.updateCoins(currentCoins + pack.coins)
      );

      alert(`You bought ${pack.coins} Coins for ${pack.price.toFixed(2)}€`);
    } catch (err) {
      console.log(err);
      alert('Buying coins failed');
    }
  }

  protected async buyCustomCoins(value: string) {
  const coins = Number(value);

  if (!coins || coins <= 0) {
    alert('Please enter a valid coin amount');
    return;
  }

  const price = coins / 100;
  const currentCoins = this.service.currentUser()?.coins ?? 0;

  try {
    await firstValueFrom(
      this.service.updateCoins(currentCoins + coins)
    );

    alert(`You bought ${coins} Coins for ${price.toFixed(2)}€`);
  } catch (err) {
    console.log(err);
    alert('Buying custom coins failed');
  }
 }

  protected async buySubscription() {
    if(this.service.premium() === 1) {
      alert('You already own Edubet+ Subscription!');
      return;
    }
    
    try {
      await firstValueFrom(this.service.buyPremium());

      alert('You bought EduBet+ Subscription for 9.99€ per month');
    } catch (err) {
      console.log(err);
      alert('Buying EduBet+ failed');
    }
  }

  protected getNormalPrice(coins: number) {
    return (coins / 100).toFixed(2);
  }
}