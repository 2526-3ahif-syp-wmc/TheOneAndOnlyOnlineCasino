import { Component } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

interface Player {
  name: string;
  value?: number;
  level?: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.scss']
})
export class Leaderboard {

  topWinsToday: Player[] = [
    { name: 'Aldin', value: 9999, level: 42 },
    { name: 'HighRoller', value: 7200, level: 38 },
    { name: 'LuckyStrike', value: 6100, level: 35 },
    { name: 'GoldenGambler', value: 5400, level: 33 },
    { name: 'CoinsCollector', value: 4200, level: 31 }
  ];

  topLossesToday: Player[] = [
    { name: 'RiskyRay', value: 8500, level: 40 },
    { name: 'BetMaster', value: 6800, level: 36 },
    { name: 'SpinnerKing', value: 5900, level: 34 },
    { name: 'DiceRoller', value: 4700, level: 32 },
    { name: 'SlotFanatic', value: 3900, level: 29 }
  ];

  topWinsAllTime: Player[] = [
    { name: 'CasinoKing', value: 125400, level: 99 },
    { name: 'JackpotJunkie', value: 98300, level: 88 },
    { name: 'ProfitPro', value: 87600, level: 82 },
    { name: 'WealthWizard', value: 76200, level: 77 },
    { name: 'VIP_Legend', value: 65800, level: 71 }
  ];

  highestLevels: Player[] = [
    { name: 'GrandMaster', level: 150 },
    { name: 'EliteGamer', level: 145 },
    { name: 'ProPlayer', level: 142 },
    { name: 'VIP_Champion', level: 138 },
    { name: 'TopTier', level: 135 }
  ];

  getRankClass(index: number): string {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  }

  getMedalEmoji(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  }
}