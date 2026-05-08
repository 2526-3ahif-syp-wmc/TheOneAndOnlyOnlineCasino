import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/user-service';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'cashed-out';

type DifficultyConfig = {
  gridSize: number;
  bombs: number;
  multiplierStep: number;
  label: string;
};

type Cell = {
  idx: number;
  mine: boolean;
  revealed: boolean;
  exploded: boolean;
};

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    gridSize: 4,
    bombs: 3,
    multiplierStep: 0.22,
    label: 'Easy',
  },
  medium: {
    gridSize: 5,
    bombs: 5,
    multiplierStep: 0.3,
    label: 'Medium',
  },
  hard: {
    gridSize: 6,
    bombs: 9,
    multiplierStep: 0.38,
    label: 'Hard',
  },
};

@Component({
  selector: 'app-mines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mines-game.html',
  styleUrls: ['./mines-game.scss'],
})
export class MinesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private userService = inject(UserService);

  balance = this.userService.coins();
  bet = 25;
  difficulty: Difficulty = 'medium';
  status: GameStatus = 'idle';
  cells: Cell[] = [];
  currentWin = 0;
  multiplier = 1;
  safeReveals = 0;
  showHowTo = false;

  private roundStarted = false;
  private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];
  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';

  constructor() {
    this.buildBoard();
  }

  ngOnInit(): void {
    this.balance = this.userService.coins();
    this.hideGlobalChrome();
  }

  ngOnDestroy(): void {
    this.restoreGlobalChrome();
  }

  get config(): DifficultyConfig {
    return DIFFICULTY_CONFIG[this.difficulty];
  }

  get gridSize(): number {
    return this.config.gridSize;
  }

  get bombs(): number {
    return this.config.bombs;
  }

  get safeTilesTotal(): number {
    return this.gridSize * this.gridSize - this.bombs;
  }

  get boardStyle() {
    return {
      'grid-template-columns': `repeat(${this.gridSize}, minmax(0, 1fr))`,
    };
  }

  get canCashOut(): boolean {
    return this.roundStarted && this.currentWin > 0 && this.status === 'playing';
  }

  get startButtonLabel(): string {
    return this.roundStarted ? 'New Game' : 'Start Game';
  }

  get statusLabel(): string {
    switch (this.status) {
      case 'playing':
        return 'Playing';
      case 'won':
        return 'All safe tiles revealed';
      case 'lost':
        return 'Bomb exploded';
      case 'cashed-out':
        return 'Cashed out';
      default:
        return 'Ready';
    }
  }

  get remainingSafeTiles(): number {
    return Math.max(this.safeTilesTotal - this.safeReveals, 0);
  }

  setDifficulty(level: Difficulty) {
    if (this.status === 'playing') {
      return;
    }

    this.difficulty = level;
    this.resetRound(false);
  }

  async startGame() {
    if (this.status === 'playing') {
      this.resetRound(false);
      return;
    }

    if (this.bet <= 0) {
      this.status = 'idle';
      alert('Bet must be higher than 0');
      return;
    }

    if (this.bet > this.balance) {
      this.status = 'idle';
      alert('Not enough coins');
      return;
    }

    const newBalance = this.balance - this.bet;

    try {
      const updatedUser = await firstValueFrom(
        this.userService.updateCoins(newBalance)
      );

      this.balance = updatedUser.coins;
    } catch (err) {
      console.log(err);
      alert('Could not start game');
      return;
    }

    this.currentWin = 0;
    this.multiplier = 1;
    this.safeReveals = 0;
    this.roundStarted = true;
    this.status = 'playing';

    this.buildBoard();
    this.placeBombs();
  }

  async cashOut() {
    if (!this.canCashOut) {
      return;
    }

    const newBalance = this.balance + this.currentWin;

    try {
      const updatedUser = await firstValueFrom(
        this.userService.updateCoins(newBalance)
      );

      this.balance = updatedUser.coins;
    } catch (err) {
      console.log(err);
      alert('Cash out failed');
      return;
    }

    this.status = 'cashed-out';
    this.roundStarted = false;
  }

  async reveal(index: number) {
    if (this.status !== 'playing') {
      return;
    }

    const cell = this.cells[index];

    if (!cell || cell.revealed) {
      return;
    }

    cell.revealed = true;

    if (cell.mine) {
      cell.exploded = true;
      this.revealAllBombs();

      this.currentWin = 0;
      this.multiplier = 1;
      this.status = 'lost';
      this.roundStarted = false;

      try {
        const updatedUser = await firstValueFrom(
          this.userService.updateCoins(this.balance)
        );

        this.balance = updatedUser.coins;
      } catch (err) {
        console.log(err);
      }

      return;
    }

    this.safeReveals += 1;
    this.multiplier = Number(
      (1 + this.safeReveals * this.config.multiplierStep).toFixed(2)
    );

    this.currentWin = Math.max(1, Math.floor(this.bet * this.multiplier));

    if (this.safeReveals >= this.safeTilesTotal) {
      const newBalance = this.balance + this.currentWin;

      try {
        const updatedUser = await firstValueFrom(
          this.userService.updateCoins(newBalance)
        );

        this.balance = updatedUser.coins;
      } catch (err) {
        console.log(err);
        alert('Could not save win');
        return;
      }

      this.status = 'won';
      this.roundStarted = false;
    }
  }

  openHowTo() {
    this.showHowTo = true;
  }

  closeHowTo() {
    this.showHowTo = false;
  }

  resetRound(resetBet = true) {
    this.buildBoard();
    this.currentWin = 0;
    this.multiplier = 1;
    this.safeReveals = 0;
    this.roundStarted = false;
    this.status = 'idle';

    if (resetBet) {
      this.bet = Math.min(this.bet, this.balance || 1);
    }
  }

  private buildBoard() {
    this.cells = Array.from(
      { length: this.gridSize * this.gridSize },
      (_, idx) => ({
        idx,
        mine: false,
        revealed: false,
        exploded: false,
      })
    );
  }

  private placeBombs() {
    const indexes = [...this.cells.keys()];
    const shuffled = indexes.sort(() => Math.random() - 0.5);

    for (const idx of shuffled.slice(0, this.bombs)) {
      this.cells[idx].mine = true;
    }
  }

  private revealAllBombs() {
    for (const cell of this.cells) {
      if (cell.mine) {
        cell.revealed = true;
      }
    }
  }

  exitGame() {
    this.restoreGlobalChrome();
    this.router.navigate(['/games']);
  }

  private hideGlobalChrome() {
    if (typeof document === 'undefined') {
      return;
    }

    const elements = [
      document.querySelector('app-nav-bar'),
      document.querySelector('footer')
    ];

    for (const element of elements) {
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      this.hiddenChrome.push({
        element,
        previousDisplay: element.style.display,
      });

      element.style.display = 'none';
    }

    this.previousBodyOverflow = document.body.style.overflow;
    this.previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  private restoreGlobalChrome() {
    if (typeof document === 'undefined') {
      return;
    }

    for (const item of this.hiddenChrome) {
      item.element.style.display = item.previousDisplay;
    }

    this.hiddenChrome = [];

    document.body.style.overflow = this.previousBodyOverflow;
    document.documentElement.style.overflow = this.previousHtmlOverflow;
  }
}