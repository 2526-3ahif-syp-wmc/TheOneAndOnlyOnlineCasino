import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-roulette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roulette-game.html',
  styleUrls: ['./roulette-game.scss']
})
export class RouletteComponent implements OnInit {
  balance: number = 5000;
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
  
  numbers: number[] = Array.from({ length: 36 }, (_, i) => i + 1);
  trackNumbers: number[] = [];
  trackPosition: number = 0;
  quickChips: number[] = [50, 100, 250, 500, 1000];
  
  private animationId: number | null = null;
  private startTime: number = 0;
  private duration: number = 3000;
  private startPosition: number = 0;
  private targetPosition: number = 0;
  
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.initTrackNumbers();
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
  
  adjustBet(amount: number) {
    const newBet = this.currentBet + amount;
    if (newBet >= 10 && newBet <= this.balance) {
      this.currentBet = newBet;
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
    if (this.currentBet > this.balance - this.currentBetTotal) {
      return;
    }
    
    const existingBet = this.activeBets.find(b => b.type === 'number' && b.value === number);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'number',
        value: number,
        amount: this.currentBet,
        label: `${number}`
      });
    }
  }
  
  placeColorBet(color: string) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) {
      return;
    }
    
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
    if (this.currentBet > this.balance - this.currentBetTotal) {
      return;
    }
    
    const existingBet = this.activeBets.find(b => b.type === 'evenodd' && b.value === type);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'evenodd',
        value: type,
        amount: this.currentBet,
        label: type === 'even' ? 'Even' : 'Odd'
      });
    }
  }
  
  placeHighLowBet(type: string) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) {
      return;
    }
    
    const existingBet = this.activeBets.find(b => b.type === 'highlow' && b.value === type);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'highlow',
        value: type,
        amount: this.currentBet,
        label: type === 'low' ? '1-18' : '19-36'
      });
    }
  }
  
  placeDozenBet(dozen: number) {
    if (this.isSpinning) return;
    if (this.currentBet > this.balance - this.currentBetTotal) {
      return;
    }
    
    const existingBet = this.activeBets.find(b => b.type === 'dozen' && b.value === dozen);
    if (existingBet) {
      existingBet.amount += this.currentBet;
    } else {
      this.activeBets.push({
        type: 'dozen',
        value: dozen,
        amount: this.currentBet,
        label: `${dozen}st Dozen`
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
  
  spinWheel() {
    if (this.isSpinning || this.activeBets.length === 0) return;
    if (this.currentBetTotal > this.balance) {
      return;
    }
    
    // Deduct total bet amount
    this.balance -= this.currentBetTotal;
    this.isSpinning = true;
    this.winningIndex = -1;
    this.cdr.detectChanges();
    
    // Calculate random target - different distance for variety (MEHR BEWEGUNG!)
    const travelDistance = 2500 + Math.random() * 2000;
    this.startPosition = this.trackPosition;
    this.targetPosition = this.startPosition - travelDistance;
    this.startTime = performance.now();
    
    this.animateTrack();
  }
  
  private animateTrack() {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);
      // Benutze eine stärkere Easing-Funktion für flüssigeres Gefühl
      const easeOutCubic = 1 - Math.pow(1 - progress, 4);
      
      this.trackPosition = this.startPosition + (this.targetPosition - this.startPosition) * easeOutCubic;
      
      // Reset position for infinite effect when at edge
      if (this.trackPosition <= -2100) {
        this.trackPosition += 2100;
        this.startPosition += 2100;
        this.targetPosition += 2100;
      }
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.determineWinner();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  private determineWinner() {
    // Calculate winning number based on final track position
    const segmentWidth = 72;
    const containerWidth = window.innerWidth;
    const centerX = containerWidth / 2;
    const trackElement = document.querySelector('.number-track') as HTMLElement;
    const trackOffset = trackElement ? trackElement.getBoundingClientRect().left : 0;
    
    const visibleIndex = Math.floor((centerX - trackOffset) / segmentWidth);
    const centerIndex = Math.floor(this.trackNumbers.length / 3) + visibleIndex;
    let winningNumber = this.trackNumbers[centerIndex % this.trackNumbers.length];
    
    // Fallback falls was schiefgeht
    if (isNaN(winningNumber)) {
      const rouletteOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
      winningNumber = rouletteOrder[Math.floor(Math.random() * rouletteOrder.length)];
    }
    
    const winningColor = this.getNumberColor(winningNumber);
    const winningColorName = winningColor === '#dc2626' ? 'Red' : winningColor === '#1f2937' ? 'Black' : 'Green';
    
    // Find and highlight the winning number in track
    for (let i = 0; i < this.trackNumbers.length; i++) {
      if (this.trackNumbers[i] === winningNumber && Math.abs(i - centerIndex) < 8) {
        this.winningIndex = i;
        break;
      }
    }
    
    // Evaluate bets
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
      
      if (won) {
        const winAmount = bet.amount * (multiplier + 1);
        totalWin += winAmount;
      }
    }
    
    // Add to history
    const newResult: Result = {
      number: winningNumber,
      color: winningColor,
      colorName: winningColorName
    };
    this.resultsHistory.unshift(newResult);
    if (this.resultsHistory.length > 15) {
      this.resultsHistory.pop();
    }
    
    // Update balance and show animations
    if (totalWin > 0) {
      this.balance += totalWin;
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
    
    // Clear bets
    this.activeBets = [];
    this.isSpinning = false;
    this.animationId = null;
    this.cdr.detectChanges();
    
    // Remove highlight after animation
    setTimeout(() => {
      this.winningIndex = -1;
      this.cdr.detectChanges();
    }, 1500);
  }
  
  goBack() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.router.navigate(['/games']);
  }
}