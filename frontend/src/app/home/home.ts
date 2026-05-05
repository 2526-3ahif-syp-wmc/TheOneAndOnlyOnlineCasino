import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private service = inject(UserService);

  protected username = this.service.username;
  protected coins = this.service.coins;
}
