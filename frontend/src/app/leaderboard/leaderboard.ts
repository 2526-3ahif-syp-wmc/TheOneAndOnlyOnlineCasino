import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgClass],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.scss']
})
export class Leaderboard {

  players = [
    { name: 'Aldin', coins: 9999 },
    { name: 'Player2', coins: 7200 },
    { name: 'Player3', coins: 6100 },
    { name: 'Player4', coins: 4000 }
  ];

  getRankClass(index: number): string {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  }
}