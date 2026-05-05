import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private service = inject(UserService);

  protected username = this.service.username;
  protected coins = this.service.coins;
}
