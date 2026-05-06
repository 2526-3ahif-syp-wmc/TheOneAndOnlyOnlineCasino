import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../services/user-service';

interface RouletteNumber {
  number: number;
  color: string;
}

@Component({
  selector: 'app-roulette-game',
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './roulette-game.html',
  styleUrl: './roulette-game.scss',
})
export class RouletteGame {
  private userService = inject(UserService);

  // Roulette wheel numbers
  rouletteNumbers: RouletteNumber[] = [
    { number: 0, color: 'green' },
    { number: 1, color: 'red' },
    { number: 2, color: 'black' },
    { number: 3, color: 'red' },
    { number: 4, color: 'black' },
    { number: 5, color: 'red' },
    { number: 6, color: 'black' },
    { number: 7, color: 'red' },
    { number: 8, color: 'black' },
    { number: 9, color: 'red' },
    { number: 10, color: 'black' },
    { number: 11, color: 'black' },
    { number: 12, color: 'red' },
    { number: 13, color: 'black' },
    { number: 14, color: 'red' },
    { number: 15, color: 'black' },
    { number: 16, color: 'red' },
    { number: 17, color: 'black' },
    { number: 18, color: 'red' },
    { number: 19, color: 'red' },
    { number: 20, color: 'black' },
    { number: 21, color: 'red' },
    { number: 22, color: 'black' },
    { number: 23, color: 'red' },
    { number: 24, color: 'black' },
    { number: 25, color: 'red' },
    { number: 26, color: 'black' },
    { number: 27, color: 'red' },
    { number: 28, color: 'black' },
    { number: 29, color: 'black' },
    { number: 30, color: 'red' },
    { number: 31, color: 'black' },
    { number: 32, color: 'red' },
    { number: 33, color: 'black' },
    { number: 34, color: 'red' },
    { number: 35, color: 'black' },
    { number: 36, color: 'red' },
  ];

  // Signals for state
  betAmount = signal(0);
  betType = signal<'number' | 'color'>('number');
  betNumber = signal<number | null>(null);
  betColor = signal<'red' | 'black' | null>(null);
  spinning = signal(false);
  result = signal<RouletteNumber | null>(null);
  message = signal('');

  // Computed for current user coins
  coins = this.userService.coins;

  placeBet() {
    if (this.betAmount() <= 0) {
      this.message.set('Please enter a valid bet amount.');
      return;
    }
    if (this.betType() === 'number' && this.betNumber() === null) {
      this.message.set('Please select a number to bet on.');
      return;
    }
    if (this.betType() === 'color' && this.betColor() === null) {
      this.message.set('Please select a color to bet on.');
      return;
    }
    if (this.betAmount() > this.coins()) {
      this.message.set('Not enough coins.');
      return;
    }

    // Deduct bet from balance
    this.userService.decreaseCoins(this.betAmount()).subscribe({
      next: () => {
        this.spin();
      },
      error: (err) => {
        this.message.set(err.message);
      }
    });
  }

  spin() {
    this.spinning.set(true);
    this.result.set(null);
    this.message.set('Spinning...');

    // Simulate spin delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * this.rouletteNumbers.length);
      const winningNumber = this.rouletteNumbers[randomIndex];
      this.result.set(winningNumber);
      this.spinning.set(false);

      this.calculateWin(winningNumber);
    }, 2000);
  }

  calculateWin(winningNumber: RouletteNumber) {
    let win = false;
    let payout = 0;

    if (this.betType() === 'number' && this.betNumber() === winningNumber.number) {
      win = true;
      payout = this.betAmount() * 35; // 35:1 payout for number
    } else if (this.betType() === 'color' && this.betColor() === winningNumber.color) {
      win = true;
      payout = this.betAmount() * 2; // 1:1 payout for color
    }

    if (win) {
      this.userService.updateCoins(this.coins() + payout).subscribe({
        next: () => {
          this.message.set(`You won! ${winningNumber.number} (${winningNumber.color}). Payout: ${payout} coins.`);
        },
        error: (err) => {
          this.message.set('Error updating balance.');
        }
      });
    } else {
      this.message.set(`You lost. ${winningNumber.number} (${winningNumber.color}).`);
    }
  }
}
