import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user-service';

type Cell = { idx: number; mine: boolean; revealed: boolean };

@Component({
  selector: 'app-mines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mines-game.html',
  styleUrls: ['./mines-game.scss']
})
export class MinesComponent {
  private router = inject(Router);
  private userService = inject(UserService);

  gridSize = 5;
  minesCount = 5;
  cells: Cell[] = [];
  started = false;
  bet: number = 10;
  currentWin = 0;
  revealedCount = 0;
  status: 'idle' | 'lost' | 'playing' | 'won' = 'idle';
  showHowTo = false;

  // ephemeral local balance (for UI only)
  localBalance = this.userService.coins();

  constructor() {
    this.resetGrid();
  }

  private lastPlayedKey = 'edubet.lastplayed';

  private addLastPlayedEntry() {
    try {
      const raw = localStorage.getItem(this.lastPlayedKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const title = 'Mines';
      const next = [title, ...list.filter(t => t !== title)].slice(0, 5);
      localStorage.setItem(this.lastPlayedKey, JSON.stringify(next));
    } catch {}
  }

  get totalCells() {
    return this.gridSize * this.gridSize;
  }

  resetGrid() {
    this.cells = Array.from({ length: this.totalCells }, (_, i) => ({ idx: i, mine: false, revealed: false }));
    this.started = false;
    this.currentWin = 0;
    this.revealedCount = 0;
    this.status = 'idle';
  }

  placeMines(firstIdx?: number) {
    const available = this.cells.map(c => c.idx).filter(i => i !== firstIdx);
    const shuffled = available.sort(() => Math.random() - 0.5);
    const mines = shuffled.slice(0, this.minesCount);
    this.cells.forEach(c => c.mine = mines.includes(c.idx));
  }

  startIfNeeded(idx: number) {
    if (!this.started) {
      this.placeMines(idx);
      this.started = true;
      this.status = 'playing';
      // record that the user started Mines
      this.addLastPlayedEntry();
    }
  }

  reveal(idx: number) {
    if (this.status === 'lost' || this.status === 'won') return;
    if (this.bet <= 0) return;

    this.startIfNeeded(idx);

    const cell = this.cells[idx];
    if (cell.revealed) return;

    cell.revealed = true;
    if (cell.mine) {
      this.status = 'lost';
      this.revealAllMines();
      this.currentWin = 0;
      return;
    }

    this.revealedCount++;
    // simple multiplier that grows with safe reveals
    const multiplier = 1 + this.revealedCount * 0.25;
    this.currentWin = Math.floor(this.bet * multiplier);

    // win condition: reveal all non-mine cells
    if (this.revealedCount >= this.totalCells - this.minesCount) {
      this.status = 'won';
    }
  }

  revealAllMines() {
    this.cells.forEach(c => { if (c.mine) c.revealed = true; });
  }

  cashOut() {
    if (this.currentWin <= 0) return;
    this.localBalance += this.currentWin;
    // do not call backend in this demo
    // record last played on successful cashout
    this.addLastPlayedEntry();
    this.resetGrid();
  }

  startNew() {
    this.resetGrid();
  }

  toggleHowTo() {
    this.showHowTo = !this.showHowTo;
  }
}
