import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user-service';
import { AlertService } from '../services/alert-service';
import { LeaderboardService } from '../services/leaderboard-service';
import { MysteryBoxService } from '../services/mystery-box-service';
import { firstValueFrom } from 'rxjs';

interface Bet {
  type: 'number' | 'color' | 'evenodd' | 'highlow' | 'dozen';
  value: number | string;
  amount: number;
  label: string;
}

interface Result {
  number: number;
  color: string;
  colorName: string;
}

interface SpinResult {
  betLabel: string;
  betAmount: number;
  won: boolean;
  winAmount: number;
}

@Component({
  selector: 'app-roulette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roulette-game.html',
  styleUrls: ['./roulette-game.scss'],
})
export class RouletteComponent implements OnInit, OnDestroy {
  @ViewChild('trackElement') trackElement!: ElementRef<HTMLElement>;

  protected userService = inject(UserService);
  private leaderboardService = inject(LeaderboardService);


  balance: number = this.userService.coins();
  currentBet: number = 50;
  isSpinning: boolean = false;
  activeBets: Bet[] = [];

  lastResult: Result | null = null;
  resultsHistory: Result[] = [];

  lastWin: number = 0;
  lastLoss: number = 0;

  showWinAnimation: boolean = false;
  showLossAnimation: boolean = false;

  winningIndex: number = -1;

  lastSpinResults: SpinResult[] = [];
  totalSpinWin: number = 0;

  numbers: number[] = Array.from({ length: 36 }, (_, i) => i + 1);
  trackNumbers: number[] = [];
  quickChips: number[] = [50, 100];

  trackPosition: number = 0;

  private animationId: number | null = null;
  private startTime: number = 0;
  private duration: number = 2500;
  private startPosition: number = 0;
  private targetPosition: number = 0;

  private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initTrackNumbers();
    this.hideGlobalChrome();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.restoreGlobalChrome();
  }

  private initTrackNumbers(): void {
    const rouletteOrder = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
      10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
    ];

    this.trackNumbers = [...rouletteOrder, ...rouletteOrder, ...rouletteOrder];
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

  get currentBetTotal(): number {
    return this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  }

  getNumberColor(number: number): string {
    if (number === 0) {
      return '#2e7d32';
    }

    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];

    return redNumbers.includes(number) ? '#dc2626' : '#1f2937';
  }

  getBetColor(bet: Bet): string {
    switch (bet.type) {
      case 'color':
        return bet.value === 'red' ? '#dc2626' : '#1f2937';

      case 'number':
        return this.getNumberColor(Number(bet.value));

      default:
        return '#a855f7';
    }
  }

  setBet(amount: number): void {
    if (amount <= this.balance - this.currentBetTotal) {
      this.currentBet = amount;
    }
  }

  hasBetOnNumber(number: number): boolean {
    return this.activeBets.some((b) => b.type === 'number' && b.value === number);
  }

  hasBetOnColor(color: string): boolean {
    return this.activeBets.some((b) => b.type === 'color' && b.value === color);
  }

  hasBetOnEvenOdd(type: string): boolean {
    return this.activeBets.some((b) => b.type === 'evenodd' && b.value === type);
  }

  hasBetOnHighLow(type: string): boolean {
    return this.activeBets.some((b) => b.type === 'highlow' && b.value === type);
  }

  hasBetOnDozen(dozen: number): boolean {
    return this.activeBets.some((b) => b.type === 'dozen' && b.value === dozen);
  }

  placeNumberBet(number: number): void {
    if (!this.canPlaceBet()) {
      this.notifyBetBlocked();
      return;
    }

    const existingBet = this.activeBets.find(
      (b) => b.type === 'number' && b.value === number
    );

    if (existingBet) {
      existingBet.amount += this.currentBet;
      return;
    }

    this.activeBets.push({
      type: 'number',
      value: number,
      amount: this.currentBet,
      label: `Number ${number}`,
    });
  }

  placeColorBet(color: string): void {
    if (!this.canPlaceBet()) {
      this.notifyBetBlocked();
      return;
    }

    const existingBet = this.activeBets.find(
      (b) => b.type === 'color' && b.value === color
    );

    if (existingBet) {
      existingBet.amount += this.currentBet;
      return;
    }

    this.activeBets.push({
      type: 'color',
      value: color,
      amount: this.currentBet,
      label: color === 'red' ? '🔴 Red' : '⚫ Black',
    });
  }

  placeEvenOddBet(type: string): void {
    if (!this.canPlaceBet()) {
      this.notifyBetBlocked();
      return;
    }

    const existingBet = this.activeBets.find(
      (b) => b.type === 'evenodd' && b.value === type
    );

    if (existingBet) {
      existingBet.amount += this.currentBet;
      return;
    }

    this.activeBets.push({
      type: 'evenodd',
      value: type,
      amount: this.currentBet,
      label: type === 'even' ? 'Even Numbers' : 'Odd Numbers',
    });
  }

  placeHighLowBet(type: string): void {
    if (!this.canPlaceBet()) {
      this.notifyBetBlocked();
      return;
    }

    const existingBet = this.activeBets.find(
      (b) => b.type === 'highlow' && b.value === type
    );

    if (existingBet) {
      existingBet.amount += this.currentBet;
      return;
    }

    this.activeBets.push({
      type: 'highlow',
      value: type,
      amount: this.currentBet,
      label: type === 'low' ? '1-18 (Low)' : '19-36 (High)',
    });
  }

  placeDozenBet(dozen: number): void {
    if (!this.canPlaceBet()) {
      this.notifyBetBlocked();
      return;
    }

    const existingBet = this.activeBets.find(
      (b) => b.type === 'dozen' && b.value === dozen
    );

    if (existingBet) {
      existingBet.amount += this.currentBet;
      return;
    }

    const dozenLabel =
      dozen === 1 ? '1st Dozen (1-12)' : dozen === 2 ? '2nd Dozen (13-24)' : '3rd Dozen (25-36)';

    this.activeBets.push({
      type: 'dozen',
      value: dozen,
      amount: this.currentBet,
      label: dozenLabel,
    });
  }

  private canPlaceBet(): boolean {
    if (this.isSpinning) {
      return false;
    }

    return this.currentBet <= this.balance - this.currentBetTotal;
  }

  private notifyBetBlocked(): void {
    if (this.isSpinning) {
      this.alertService.info('Wait for the current spin to finish before placing more bets.');
      return;
    }

    this.alertService.error('Not enough coins available to place that bet.');
  }

  removeBet(bet: Bet): void {
    if (this.isSpinning) {
      return;
    }

    const index = this.activeBets.indexOf(bet);

    if (index > -1) {
      this.activeBets.splice(index, 1);
    }
  }

  clearAllBets(): void {
    if (this.isSpinning) {
      return;
    }

    this.activeBets = [];
  }

  clearHistory(): void {
    this.resultsHistory = [];
    this.cdr.detectChanges();
  }

  closeProtocol(): void {
    this.lastSpinResults = [];
    this.cdr.detectChanges();
  }

  async spinWheel(): Promise<void> {
    if (this.isSpinning) {
      this.alertService.info('The roulette is already spinning.');
      return;
    }

    if (this.activeBets.length === 0) {
      this.alertService.info('Place at least one bet before spinning.');
      return;
    }

    if (this.currentBetTotal > this.balance) {
      this.alertService.error('Not enough coins to cover your current bets.');
      return;
    }

    this.balance -= this.currentBetTotal;
    this.isSpinning = true;
    this.winningIndex = -1;
    this.lastSpinResults = [];
    this.totalSpinWin = 0;

    this.cdr.detectChanges();

    const scrollDistance = 1800 + Math.random() * 1200;

    this.startPosition = this.trackPosition;
    this.targetPosition = this.startPosition - scrollDistance;
    this.startTime = performance.now();

    await firstValueFrom(this.userService.updateXp(this.userService.xp() + 10));

    this.animateTrack();
  }

  private animateTrack(): void {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);

      const easedProgress = this.easeOutCubic(progress);

      this.trackPosition =
        this.startPosition + (this.targetPosition - this.startPosition) * easedProgress;

      if (this.trackElement) {
        this.trackElement.nativeElement.style.transform = `translateX(${this.trackPosition}px)`;
      }

      if (this.trackPosition <= -2500) {
        this.trackPosition += 2500;
        this.startPosition += 2500;
        this.targetPosition += 2500;
      }

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.determineWinner();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private easeOutCubic(progress: number): number {
    return 1 - Math.pow(1 - progress, 3);
  }

  private getVisualWinner(): { number: number; index: number } {
    const track = this.trackElement?.nativeElement;

    if (!track) {
      return this.getFallbackWinner();
    }

    const wrapper = track.closest('.track-wrapper') as HTMLElement | null;

    if (!wrapper) {
      return this.getFallbackWinner();
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const centerX = wrapperRect.left + wrapperRect.width / 2;

    const cells = Array.from(track.querySelectorAll<HTMLElement>('.track-number'));

    let closestCell: HTMLElement | null = null;
    let smallestDistance = Infinity;

    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      const cellCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(cellCenterX - centerX);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestCell = cell;
      }
    }

    if (!closestCell) {
      return this.getFallbackWinner();
    }

    const number = Number(closestCell.dataset['number']);
    const index = Number(closestCell.dataset['index']);

    if (Number.isNaN(number) || Number.isNaN(index)) {
      return this.getFallbackWinner();
    }

    return { number, index };
  }

  private getFallbackWinner(): { number: number; index: number } {
    const rouletteOrder = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
      10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
    ];

    const number = rouletteOrder[Math.floor(Math.random() * rouletteOrder.length)];
    const index = this.trackNumbers.findIndex((n) => n === number);

    return { number, index };
  }

  private async determineWinner(): Promise<void> {
    const winner = this.getVisualWinner();

    const winningNumber = winner.number;
    this.winningIndex = winner.index;

    const winningColor = this.getNumberColor(winningNumber);
    const winningColorName =
      winningColor === '#dc2626'
        ? 'Red'
        : winningColor === '#1f2937'
          ? 'Black'
          : 'Green';

    const spinResults: SpinResult[] = [];
    let totalWin = 0;

    for (const bet of this.activeBets) {
      let won = false;
      let multiplier = 0;

      switch (bet.type) {
        case 'number':
          if (bet.value === winningNumber) {
            won = true;
            multiplier = 35;
          }
          break;

        case 'color':
          if (
            (bet.value === 'red' && winningColor === '#dc2626') ||
            (bet.value === 'black' && winningColor === '#1f2937')
          ) {
            won = true;
            multiplier = 1;
          }
          break;

        case 'evenodd':
          if (winningNumber !== 0) {
            if (
              (bet.value === 'even' && winningNumber % 2 === 0) ||
              (bet.value === 'odd' && winningNumber % 2 === 1)
            ) {
              won = true;
              multiplier = 1;
            }
          }
          break;

        case 'highlow':
          if (winningNumber !== 0) {
            if (
              (bet.value === 'low' && winningNumber >= 1 && winningNumber <= 18) ||
              (bet.value === 'high' && winningNumber >= 19 && winningNumber <= 36)
            ) {
              won = true;
              multiplier = 1;
            }
          }
          break;

        case 'dozen':
          if (winningNumber !== 0) {
            if (
              (bet.value === 1 && winningNumber >= 1 && winningNumber <= 12) ||
              (bet.value === 2 && winningNumber >= 13 && winningNumber <= 24) ||
              (bet.value === 3 && winningNumber >= 25 && winningNumber <= 36)
            ) {
              won = true;
              multiplier = 2;
            }
          }
          break;
      }

      const winAmount = won ? bet.amount * (multiplier + 1) : 0;
      totalWin += winAmount;

      spinResults.push({
        betLabel: bet.label,
        betAmount: bet.amount,
        won,
        winAmount,
      });
    }

    const totalBet = this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);

    this.lastSpinResults = spinResults;
    this.totalSpinWin = totalWin - totalBet;

    const newResult: Result = {
      number: winningNumber,
      color: winningColor,
      colorName: winningColorName,
    };

    this.resultsHistory.unshift(newResult);

    if (this.resultsHistory.length > 15) {
      this.resultsHistory.pop();
    }

    const bonus = Math.floor(totalWin * 0.10);
    const totalPayout = totalWin + bonus;
    const updatedFinalBalance = this.balance + totalPayout;

    const updatedUser = await firstValueFrom(this.userService.updateCoins(updatedFinalBalance));
    this.balance = updatedUser.coins;

    this.saveGameHistory(totalBet, totalPayout);

    if (totalWin > 0) {
      this.lastWin = totalPayout;
      this.lastLoss = 0;
      this.showWinAnimation = true;
      this.alertService.success(`You won ${totalPayout} EC${bonus > 0 ? ` (+${bonus} bonus)` : ''}`);

      setTimeout(() => {
        this.showWinAnimation = false;
        this.cdr.detectChanges();
      }, 2000);
    } else {
      this.lastLoss = totalBet;
      this.lastWin = 0;
      this.showLossAnimation = true;
      this.alertService.error(`You lost ${totalBet} EC.`);

      setTimeout(() => {
        this.showLossAnimation = false;
        this.cdr.detectChanges();
      }, 2000);
    }

    this.lastResult = newResult;
    this.activeBets = [];
    this.isSpinning = false;
    this.animationId = null;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.winningIndex = -1;
      this.cdr.detectChanges();
    }, 1500);

    setTimeout(() => {
      if (this.lastSpinResults.length > 0) {
        this.lastSpinResults = [];
        this.cdr.detectChanges();
      }
    }, 8000);
  }


  private saveGameHistory(totalBet: number, totalWin: number): void {
    const user = this.userService.currentUser?.() ?? null;

    if (!user) {
      return;
    }

    const won = totalWin > 0;

    void firstValueFrom(
      this.leaderboardService.saveGameHistory({
        userId: user.id,
        gameName: 'Roulette',
        result: won ? 'win' : 'loss',
        betAmount: totalBet,
        coinsWon: won ? totalWin : 0,
        coinsLost: won ? 0 : totalBet
      })
    ).catch(error => {
      console.error('Could not save Roulette game history', error);
    });
  }

  goBack(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.router.navigate(['/home']);
  }
} 