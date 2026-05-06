import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-shop',
  imports: [],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  private service = inject(UserService);
  
  async buyCoins() {
    const currentCoins = this.service.coins();

    await firstValueFrom(
      this.service.updateCoins(currentCoins + 100)
  );
}
}
