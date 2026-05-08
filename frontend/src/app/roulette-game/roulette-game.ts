import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user-service';
import { firstValueFrom } from 'rxjs';

interface Bet {
  type: 'number' | 'color' | 'evenodd' | 'highlow' | 'dozen';
  value: any;
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
  styleUrls: ['./roulette-game.scss']
})
export class RouletteComponent implements OnInit {
  @ViewChild('trackElement') trackElement!: ElementRef;

  protected userService = inject(UserService);
  
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
  
  // Bet-Protokoll
  lastSpinResults: SpinResult[] = [];
  totalSpinWin: number = 0;
  
  numbers: number[] = Array.from({ length: 36 }, (_, i) => i + 1);
  trackNumbers: number[] = [];
  trackPosition: number = 0;
  quickChips: number[] = [50, 100, 250, 500, 1000];
  
  private animationId: number | null = null;
  private startTime: number = 0;
  private duration: number = 2500;
  private startPosition: number = 0;
  private targetPosition: number = 0;

  private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];
  
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.initTrackNumbers();
    this.hideGlobalChrome();
  }

  ngOnDestroy(): void {
    this.restoreGlobalChrome();
  }

  private restoreGlobalChrome() {
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

  private hideGlobalChrome() {
    if (typeof document === 'undefined') {
      return;
    }

    const elements = [document.querySelector('app-nav-bar'), document.querySelector('footer')];

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
  
  get currentBetTotal(): number {
    return this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  }
  
  private initTrackNumbers() {
    const rouletteOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    this.trackNumbers = [...rouletteOrder, ...rouletteOrder, ...rouletteOrder];
  }
  
  getNumberColor(number: number): string {
    if (number === 0) return '#2e7d32';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? '#dc2626' : '#1f2937';
  }
  
  getBetColor(bet: Bet): string {
    switch(bet.type) {
      case 'color': return bet.value === 'red' ? '#dc2626' : '#1f2937';
      case 'number': return this.getNumberColor(bet.value);
      default: return '#a855f7';
    }
  }
  
  setBet(amount: number) {
    if (amount <= this.balance - this.currentBetTotal) {
      this.currentBet = amount;
    }
  }
  
  hasBetOnNumber(number: number): boolean {
    return this.activeBets.some(b => b.type === 'number' && b.value === number);
  }
  
  hasBetOnColor(color: string): boolean {
    return this.activeBets.some(b => b.type === 'color' && b.value === color);
  }
  
  hasBetOnEvenOdd(type: string): boolean {
    return this.activeBets.some(b => b.type === 'evenodd' && b.value === type);
  }
  
  hasBetOnHighLow(type: string): boolean {
    return this.activeBets.some(b => b.type === 'highlow' && b.value === type);
  }
  
  hasBetOnDozen(dozen: number): boolean {
    return this.activeBets.some(b => b.type === 'dozen' && b.value === dozen);
  }
  
  placeNumberBet(number: number) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) return;
    
    const existingBet = this.activeBets.find(b => b.type === 'number' && b.value === number);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'number',
        value: number,
        amount: this.currentBet,
        label: `Number ${number}`
      });
    }
  }
  
  placeColorBet(color: string) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) return;
    
    const existingBet = this.activeBets.find(b => b.type === 'color' && b.value === color);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'color',
        value: color,
        amount: this.currentBet,
        label: color === 'red' ? '🔴 Red' : '⚫ Black'
      });
    }
  }
  
  placeEvenOddBet(type: string) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) return;
    
    const existingBet = this.activeBets.find(b => b.type === 'evenodd' && b.value === type);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'evenodd',
        value: type,
        amount: this.currentBet,
        label: type === 'even' ? 'Even Numbers' : 'Odd Numbers'
      });
    }
  }
  
  placeHighLowBet(type: string) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) return;
    
    const existingBet = this.activeBets.find(b => b.type === 'highlow' && b.value === type);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'highlow',
        value: type,
        amount: this.currentBet,
        label: type === 'low' ? '1-18 (Low)' : '19-36 (High)'
      });
    }
  }
  
  placeDozenBet(dozen: number) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) return;
    
    const existingBet = this.activeBets.find(b => b.type === 'dozen' && b.value === dozen);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'dozen',
        value: dozen,
        amount: this.currentBet,
        label: `${dozen}st Dozen (${dozen === 1 ? '1-12' : dozen === 2 ? '13-24' : '25-36'})`
      });
    }
  }
  
  removeBet(bet: Bet) {
    const index = this.activeBets.indexOf(bet);
    if (index > -1) {
      this.activeBets.splice(index, 1);
    }
  }
  
  clearAllBets() {
    this.activeBets = [];
  }
  
  clearHistory() {
    this.resultsHistory = [];
    this.cdr.detectChanges();
  }
  
  closeProtocol() {
    this.lastSpinResults = [];
    this.cdr.detectChanges();
  }
  
  spinWheel() {
    if (this.isSpinning || this.activeBets.length === 0) return;
    if (this.currentBetTotal > this.balance) return;
    
    this.balance -= this.currentBetTotal;
    this.isSpinning = true;
    this.winningIndex = -1;
    this.lastSpinResults = [];
    this.cdr.detectChanges();
    
    const scrollDistance = 1800 + Math.random() * 1200;
    this.startPosition = this.trackPosition;
    this.targetPosition = this.startPosition - scrollDistance;
    this.startTime = performance.now();
    
    this.animateTrack();
  }
  
  private async animateTrack() {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);
      
      this.trackPosition = this.startPosition + (this.targetPosition - this.startPosition) * progress;
      
      if (this.trackElement) {
        this.trackElement.nativeElement.style.transform = `translateX(${this.trackPosition}px)`;
      }
      
      if (this.trackPosition <= -2500) {
        this.trackPosition = this.trackPosition + 2500;
        this.startPosition = this.startPosition + 2500;
        this.targetPosition = this.targetPosition + 2500;
      }
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.determineWinner();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  private async determineWinner() {
    const segmentWidth = 72;
    const containerWidth = window.innerWidth;
    const centerX = containerWidth / 2;
    const trackOffset = this.trackElement ? this.trackElement.nativeElement.getBoundingClientRect().left : 0;
    
    let visibleIndex = Math.floor((centerX - trackOffset) / segmentWidth);
    let centerIndex = Math.floor(this.trackNumbers.length / 3) + visibleIndex;
    let winningNumber = this.trackNumbers[centerIndex % this.trackNumbers.length];
    
    if (isNaN(winningNumber)) {
      const rouletteOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
      winningNumber = rouletteOrder[Math.floor(Math.random() * rouletteOrder.length)];
    }
    
    const winningColor = this.getNumberColor(winningNumber);
    const winningColorName = winningColor === '#dc2626' ? 'Red' : winningColor === '#1f2937' ? 'Black' : 'Green';
    
    for (let i = 0; i < this.trackNumbers.length; i++) {
      if (this.trackNumbers[i] === winningNumber && Math.abs(i - centerIndex) < 8) {
        this.winningIndex = i;
        break;
      }
    }
    
    const spinResults: SpinResult[] = [];
    let totalWin = 0;
    
    for (const bet of this.activeBets) {
      let won = false;
      let multiplier = 0;
      
      switch(bet.type) {
        case 'number':
          if (bet.value === winningNumber) {
            won = true;
            multiplier = 35;
          }
          break;
        case 'color':
          if ((bet.value === 'red' && winningColor === '#dc2626') ||
              (bet.value === 'black' && winningColor === '#1f2937')) {
            won = true;
            multiplier = 1;
          }
          break;
        case 'evenodd':
          if (winningNumber !== 0) {
            if ((bet.value === 'even' && winningNumber % 2 === 0) ||
                (bet.value === 'odd' && winningNumber % 2 === 1)) {
              won = true;
              multiplier = 1;
            }
          }
          break;
        case 'highlow':
          if (winningNumber !== 0) {
            if ((bet.value === 'low' && winningNumber >= 1 && winningNumber <= 18) ||
                (bet.value === 'high' && winningNumber >= 19 && winningNumber <= 36)) {
              won = true;
              multiplier = 1;
            }
          }
          break;
        case 'dozen':
          if (winningNumber !== 0) {
            if ((bet.value === 1 && winningNumber >= 1 && winningNumber <= 12) ||
                (bet.value === 2 && winningNumber >= 13 && winningNumber <= 24) ||
                (bet.value === 3 && winningNumber >= 25 && winningNumber <= 36)) {
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
        won: won,
        winAmount: winAmount
      });
    }
    
    this.lastSpinResults = spinResults;
    this.totalSpinWin = totalWin;
    
    const newResult: Result = {
      number: winningNumber,
      color: winningColor,
      colorName: winningColorName
    };
    this.resultsHistory.unshift(newResult);
    if (this.resultsHistory.length > 15) {
      this.resultsHistory.pop();
    }

    const finalBalance = this.balance + totalWin;

    const updatedUser = await firstValueFrom(
      this.userService.updateCoins(finalBalance)
    );

    this.balance = updatedUser.coins;
    
    if (totalWin > 0) {
      this.lastWin = totalWin;
      this.showWinAnimation = true;
      this.lastLoss = 0;
      
      setTimeout(() => {
        this.showWinAnimation = false;
        this.cdr.detectChanges();
      }, 2000);
    } else {
      this.lastLoss = this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);
      this.showLossAnimation = true;
      this.lastWin = 0;
      
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
  
  goBack() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.router.navigate(['/games']);
  }
}   