import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertService } from '../services/alert-service';
import { UserService } from '../services/user-service';

type SlotSymbol = {
  key: string;
  label: string;
  icon: string;
  multiplier: number;
  background: string;
  glow: string;
};

type SlotLine = {
  label: string;
  cells: number[];
};

type WinningLine = {
  label: string;
  symbol: SlotSymbol;
  payout: number;
};

type SpinHistoryEntry = {
  id: number;
  cells: SlotSymbol[];
  payout: number;
  winningLines: string[];
};

type SpinEvaluation = {
  payout: number;
  winningLines: WinningLine[];
  winningCellKeys: Set<string>;
};

type ConfettiParticle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
  color: string;
  size: number;
};

type PaytableEntry = SlotSymbol;

const SLOT_SYMBOLS: SlotSymbol[] = [
  {
    key: 'cherry',
    label: 'Cherry',
    icon: '7',
    multiplier: 2,
    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.24), rgba(127, 29, 29, 0.82))',
    glow: 'rgba(244, 63, 94, 0.35)',
  },
  {
    key: 'lemon',
    label: 'Lemon',
    icon: '◆',
    multiplier: 3,
    background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.28), rgba(146, 64, 14, 0.82))',
    glow: 'rgba(250, 204, 21, 0.36)',
  },
  {
    key: 'grape',
    label: 'Grape',
    icon: '✦',
    multiplier: 4,
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(76, 29, 149, 0.82))',
    glow: 'rgba(139, 92, 246, 0.34)',
  },
  {
    key: 'bar',
    label: 'Bar',
    icon: '▰',
    multiplier: 6,
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(15, 118, 110, 0.82))',
    glow: 'rgba(56, 189, 248, 0.32)',
  },
  {
    key: 'diamond',
    label: 'Diamond',
    icon: '♦',
    multiplier: 10,
    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.26), rgba(15, 23, 42, 0.92))',
    glow: 'rgba(34, 211, 238, 0.36)',
  },
  {
    key: 'crown',
    label: 'Crown',
    icon: '♛',
    multiplier: 18,
    background: 'linear-gradient(135deg, rgba(248, 215, 107, 0.3), rgba(92, 55, 12, 0.9))',
    glow: 'rgba(248, 215, 107, 0.46)',
  },
  {
    key: 'wild',
    label: 'Wild',
    icon: '★',
    multiplier: 28,
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.32), rgba(15, 23, 42, 0.96))',
    glow: 'rgba(168, 85, 247, 0.42)',
  },
];

const SLOT_LINE_DEFS: SlotLine[] = [
  { label: 'Top row', cells: [0, 1, 2] },
  { label: 'Middle row', cells: [3, 4, 5] },
  { label: 'Bottom row', cells: [6, 7, 8] },
  { label: 'Left column', cells: [0, 3, 6] },
  { label: 'Middle column', cells: [1, 4, 7] },
  { label: 'Right column', cells: [2, 5, 8] },
  { label: 'Main diagonal', cells: [0, 4, 8] },
  { label: 'Cross diagonal', cells: [2, 4, 6] },
];

@Component({
  selector: 'app-slot-machine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './slot-machine.html',
  styleUrl: './slot-machine.scss',
})
export class SlotMachineComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);

  private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];

  protected balance = this.userService.coins();
  protected bet = 50;
  protected isSpinning = false;
  protected reels: SlotSymbol[][] = this.createGrid();
  protected recentSpins: SpinHistoryEntry[] = [];
  protected lastSpin: {
    payout: number;
    winningLines: WinningLine[];
    winningCellKeys: Set<string>;
  } | null = null;
  protected confettiParticles: ConfettiParticle[] = [];
  protected readonly quickBets = [25, 50, 100, 250, 500];
  protected readonly paytable: PaytableEntry[] = [
    SLOT_SYMBOLS[6],
    SLOT_SYMBOLS[5],
    SLOT_SYMBOLS[4],
    SLOT_SYMBOLS[3],
    SLOT_SYMBOLS[2],
    SLOT_SYMBOLS[1],
    SLOT_SYMBOLS[0],
  ];

  private readonly xpReward = 8;
  private spinIntervalId: number | null = null;
  private timeoutIds: number[] = [];
  private confettiTimeoutId: number | null = null;
  private spinCounter = 0;
  private confettiCounter = 0;

  ngOnInit(): void {
    this.balance = this.userService.coins();
    this.bet = Math.min(this.bet, Math.max(1, this.balance));
    this.hideGlobalChrome();
  }

  ngOnDestroy(): void {
    this.clearSpinTimers();
    this.restoreGlobalChrome();
  }

  protected setQuickBet(amount: number): void {
    this.bet = Math.min(amount, Math.max(1, this.balance));
  }

  protected get canSpin(): boolean {
    return !this.isSpinning && this.bet > 0 && this.bet <= this.balance;
  }

  protected get currentStatusLabel(): string {
    if (this.isSpinning) {
      return 'Spinning';
    }

    if ((this.lastSpin?.payout ?? 0) > 0) {
      return 'Won';
    }

    return 'Idle';
  }

  protected get winRatePercent(): number {
    if (this.recentSpins.length === 0) {
      return 0;
    }

    const wins = this.recentSpins.filter(spin => spin.payout > 0).length;
    return Math.round((wins / this.recentSpins.length) * 100);
  }

  protected get topPayoutHint(): string {
    if (!this.lastSpin || this.lastSpin.payout <= 0 || this.lastSpin.winningLines.length === 0) {
      return 'No win yet';
    }

    const bestLine = [...this.lastSpin.winningLines].sort((left, right) => right.payout - left.payout)[0];

    return `${bestLine.label} • ${bestLine.symbol.label}`;
  }

  protected get totalPossibleLines(): number {
    return SLOT_LINE_DEFS.length;
  }

  protected spinSlots(): void {
    if (this.isSpinning) {
      return;
    }

    if (!this.userService.isLoggedIn()) {
      this.alertService.error('You must be logged in to play');
      return;
    }

    const wager = Math.floor(this.bet);

    if (wager <= 0) {
      this.alertService.info('Set a bet amount first');
      return;
    }

    if (wager > this.balance) {
      this.alertService.error('Not enough coins');
      return;
    }

    this.clearSpinTimers();
    this.clearConfetti();
    this.isSpinning = true;
    this.lastSpin = null;

    void firstValueFrom(this.userService.addXp(this.xpReward)).catch(() => {
      // XP should not block the spin if the backend temporarily fails.
    });

    const finalGrid = this.createGrid();
    const spinDuration = 1800;
    const stopDelays = [640, 1080, spinDuration];

    this.spinIntervalId = window.setInterval(() => {
      this.reels = this.createGrid();
    }, 85);

    stopDelays.forEach((delay, index) => {
      const timeoutId = window.setTimeout(() => {
        const nextReels = [...this.reels];
        nextReels[index] = finalGrid[index];
        this.reels = nextReels;
      }, delay);

      this.timeoutIds.push(timeoutId);
    });

    const completionTimeoutId = window.setTimeout(async () => {
      this.clearSpinTimers();
      this.reels = finalGrid;

      const evaluation = this.evaluateGrid(finalGrid, wager);
      const rawNextBalance = this.balance - wager + evaluation.payout;
      const nextBalance = Math.max(0, Math.floor(rawNextBalance));

      try {
        console.debug('Saving coins', {
          user: this.userService.currentUser?.() ?? null,
          prevBalance: this.balance,
          wager,
          payout: evaluation.payout,
          nextBalance,
        });

        const updatedUser = await firstValueFrom(this.userService.updateCoins(nextBalance));
        this.balance = updatedUser.coins;
      } catch (error: any) {
        console.error('updateCoins failed', error);

        let serverMsg = 'Could not save the slot result';

        try {
          const status = error?.status;
          const bodyMsg = error?.error?.message ?? error?.message ?? JSON.stringify(error);
          serverMsg = `Could not save the slot result${status ? ' (status ' + status + ')' : ''}: ${bodyMsg}`;
        } catch (e) {
          // ignore
        }

        this.alertService.error(serverMsg);

        // Fallback: update local user state so UI reflects deduction/win immediately.
        try {
          this.userService.updateCoins(nextBalance);
          this.balance = nextBalance;
          this.alertService.info('Balance updated locally (backend unreachable)');

          // Also record the spin so UI shows last result and recent spins
          this.lastSpin = {
            payout: evaluation.payout,
            winningLines: evaluation.winningLines,
            winningCellKeys: evaluation.winningCellKeys,
          };

          this.recentSpins = [
            {
              id: ++this.spinCounter,
              cells: finalGrid.flat(),
              payout: evaluation.payout,
              winningLines: evaluation.winningLines.map(line => line.label),
            },
            ...this.recentSpins,
          ].slice(0, 6);
        } catch (e) {
          console.error('forceLocalCoins failed', e);
        }

        this.isSpinning = false;
        if (evaluation.payout > 0) {
          this.spawnConfetti();
          this.alertService.success(`You won ${evaluation.payout} EC (local)`);
        } else {
          this.alertService.info('No line matched this spin');
        }

        return;
      }

      this.lastSpin = {
        payout: evaluation.payout,
        winningLines: evaluation.winningLines,
        winningCellKeys: evaluation.winningCellKeys,
      };

      this.recentSpins = [
        {
          id: ++this.spinCounter,
          cells: finalGrid.flat(),
          payout: evaluation.payout,
          winningLines: evaluation.winningLines.map(line => line.label),
        },
        ...this.recentSpins,
      ].slice(0, 6);

      this.isSpinning = false;

      if (evaluation.payout > 0) {
        this.spawnConfetti();
        this.alertService.success(`You won ${evaluation.payout} EC`);
      } else {
        this.alertService.info('No line matched this spin');
      }
    }, spinDuration + 60);

    this.timeoutIds.push(completionTimeoutId);
  }

  protected isWinningCell(columnIndex: number, rowIndex: number): boolean {
    return this.lastSpin?.winningCellKeys.has(`${columnIndex}:${rowIndex}`) ?? false;
  }

  private createGrid(): SlotSymbol[][] {
    return Array.from({ length: 3 }, () => this.createColumn());
  }

  private createColumn(): SlotSymbol[] {
    return Array.from({ length: 3 }, () => this.pickSymbol());
  }

  private pickSymbol(): SlotSymbol {
    const totalWeight = SLOT_SYMBOLS.reduce((sum, symbol) => sum + this.getWeight(symbol), 0);
    const roll = Math.random() * totalWeight;

    let cursor = 0;

    for (const symbol of SLOT_SYMBOLS) {
      cursor += this.getWeight(symbol);

      if (roll < cursor) {
        return symbol;
      }
    }

    return SLOT_SYMBOLS[0];
  }

  private getWeight(symbol: SlotSymbol): number {
    switch (symbol.key) {
      case 'wild':
        return 2;
      case 'crown':
        return 4;
      case 'diamond':
        return 8;
      case 'bar':
        return 14;
      case 'grape':
        return 18;
      case 'lemon':
        return 26;
      default:
        return 30;
    }
  }

  private evaluateGrid(grid: SlotSymbol[][], wager: number): SpinEvaluation {
    const winningLines: WinningLine[] = [];
    const winningCellKeys = new Set<string>();

    for (const line of SLOT_LINE_DEFS) {
      const cells = line.cells.map(index => this.getSymbolAt(grid, index));
      const winningSymbol = this.getWinningSymbol(cells);

      if (!winningSymbol) {
        continue;
      }

      const payout = Math.max(0, Math.floor(wager * winningSymbol.multiplier));

      if (payout <= 0) {
        continue;
      }

      winningLines.push({
        label: line.label,
        symbol: winningSymbol,
        payout,
      });

      for (const cellIndex of line.cells) {
        const columnIndex = cellIndex % 3;
        const rowIndex = Math.floor(cellIndex / 3);

        winningCellKeys.add(`${columnIndex}:${rowIndex}`);
      }
    }

    const payout = winningLines.reduce((sum, line) => sum + line.payout, 0);

    return {
      payout,
      winningLines,
      winningCellKeys,
    };
  }

  private getSymbolAt(grid: SlotSymbol[][], cellIndex: number): SlotSymbol {
    const columnIndex = cellIndex % 3;
    const rowIndex = Math.floor(cellIndex / 3);

    return grid[columnIndex][rowIndex];
  }

  private getWinningSymbol(cells: SlotSymbol[]): SlotSymbol | null {
    const nonWildCells = cells.filter(cell => cell.key !== 'wild');

    if (nonWildCells.length === 0) {
      return this.findSymbol('wild');
    }

    const uniqueKeys = [...new Set(nonWildCells.map(cell => cell.key))];

    if (uniqueKeys.length !== 1) {
      return null;
    }

    return this.findSymbol(uniqueKeys[0]);
  }

  private findSymbol(key: string): SlotSymbol {
    return SLOT_SYMBOLS.find(symbol => symbol.key === key) ?? SLOT_SYMBOLS[0];
  }

  private clearSpinTimers(): void {
    if (this.spinIntervalId !== null) {
      clearInterval(this.spinIntervalId);
      this.spinIntervalId = null;
    }

    for (const timeoutId of this.timeoutIds) {
      clearTimeout(timeoutId);
    }

    this.timeoutIds = [];
  }

  private spawnConfetti(): void {
    this.clearConfetti();

    const colors = ['#f8d76b', '#7c3aed', '#22d3ee', '#f472b6', '#34d399', '#fb7185'];

    this.confettiParticles = Array.from({ length: 26 }, (_, index) => ({
      id: ++this.confettiCounter,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 120,
      duration: 1200 + Math.random() * 700,
      offsetX: -180 + Math.random() * 360,
      offsetY: 160 + Math.random() * 220,
      rotate: -180 + Math.random() * 360,
      color: colors[index % colors.length],
      size: 7 + Math.random() * 7,
    }));

    this.confettiTimeoutId = window.setTimeout(() => {
      this.confettiParticles = [];
      this.confettiTimeoutId = null;
    }, 2200);
  }

  private clearConfetti(): void {
    if (this.confettiTimeoutId !== null) {
      clearTimeout(this.confettiTimeoutId);
      this.confettiTimeoutId = null;
    }

    this.confettiParticles = [];
  }

  private hideGlobalChrome(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const elements = [
      document.querySelector('app-nav-bar'),
      document.querySelector('footer'),
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

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  private restoreGlobalChrome(): void {
    for (const item of this.hiddenChrome) {
      item.element.style.display = item.previousDisplay;
    }

    this.hiddenChrome = [];

    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}
