import {
Component,
OnInit,
OnDestroy,
ChangeDetectorRef,
ElementRef,
ViewChild,
inject,
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

const ROULETTE_ORDER = [
0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

@Component({
selector: 'app-roulette',
standalone: true,
imports: [CommonModule, FormsModule],
templateUrl: './roulette-game.html',
styleUrls: ['./roulette-game.scss'],
})
export class RouletteComponent implements OnInit, OnDestroy {
@ViewChild('wheelElement')
private wheelElement?: ElementRef<HTMLElement>;

protected userService = inject(UserService);
private leaderboardService = inject(LeaderboardService);
private mysteryBoxService = inject(MysteryBoxService);

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
wheelNumbers: number[] = ROULETTE_ORDER;
quickChips: number[] = [50, 100, 250];

private animationId: number | null = null;
private duration: number = 7200;
private wheelRotation: number = 0;
private startRotation: number = 0;
private targetRotation: number = 0;
private startTime: number = 0;

private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];

constructor(
private router: Router,
private cdr: ChangeDetectorRef,
private alertService: AlertService,
) {}

ngOnInit(): void {
this.balance = this.userService.coins();
this.hideGlobalChrome();
this.setWheelRotation(0);
}

ngOnDestroy(): void {
if (this.animationId !== null) {
cancelAnimationFrame(this.animationId);
}


this.restoreGlobalChrome();


}

get currentBetTotal(): number {
return this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);
}

getNumberColor(number: number): string {
if (number === 0) {
return '#138a48';
}


const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

return redNumbers.includes(number) ? '#b91c1c' : '#050509';


}

getPocketStyle(index: number): Record<string, string> {
const angle = (360 / this.wheelNumbers.length) * index;


return {
  '--pocket-rotation': `${angle}deg`,
  '--pocket-counter-rotation': `${-angle}deg`,
};


}

getBetColor(bet: Bet): string {
switch (bet.type) {
case 'color':
return bet.value === 'red' ? '#dc2626' : '#111827';


  case 'number':
    return this.getNumberColor(Number(bet.value));

  default:
    return '#a855f7';
}


}

setBet(amount: number): void {
if (this.isSpinning) {
return;
}


const available = this.balance - this.currentBetTotal;

if (amount <= available) {
  this.currentBet = Math.max(10, Math.floor(amount));
  return;
}

this.currentBet = Math.max(10, available);


}

hasBetOnNumber(number: number): boolean {
return this.activeBets.some((bet) => bet.type === 'number' && bet.value === number);
}

hasBetOnColor(color: string): boolean {
return this.activeBets.some((bet) => bet.type === 'color' && bet.value === color);
}

hasBetOnEvenOdd(type: string): boolean {
return this.activeBets.some((bet) => bet.type === 'evenodd' && bet.value === type);
}

hasBetOnHighLow(type: string): boolean {
return this.activeBets.some((bet) => bet.type === 'highlow' && bet.value === type);
}

hasBetOnDozen(dozen: number): boolean {
return this.activeBets.some((bet) => bet.type === 'dozen' && bet.value === dozen);
}

placeNumberBet(number: number): void {
if (!this.canPlaceBet()) {
this.notifyBetBlocked();
return;
}


const existingBet = this.activeBets.find((bet) => bet.type === 'number' && bet.value === number);

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


const existingBet = this.activeBets.find((bet) => bet.type === 'color' && bet.value === color);

if (existingBet) {
  existingBet.amount += this.currentBet;
  return;
}

this.activeBets.push({
  type: 'color',
  value: color,
  amount: this.currentBet,
  label: color === 'red' ? 'Red' : 'Black',
});


}

placeEvenOddBet(type: string): void {
if (!this.canPlaceBet()) {
this.notifyBetBlocked();
return;
}


const existingBet = this.activeBets.find((bet) => bet.type === 'evenodd' && bet.value === type);

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


const existingBet = this.activeBets.find((bet) => bet.type === 'highlow' && bet.value === type);

if (existingBet) {
  existingBet.amount += this.currentBet;
  return;
}

this.activeBets.push({
  type: 'highlow',
  value: type,
  amount: this.currentBet,
  label: type === 'low' ? '1-18' : '19-36',
});


}

placeDozenBet(dozen: number): void {
if (!this.canPlaceBet()) {
this.notifyBetBlocked();
return;
}


const existingBet = this.activeBets.find((bet) => bet.type === 'dozen' && bet.value === dozen);

if (existingBet) {
  existingBet.amount += this.currentBet;
  return;
}

const dozenLabel = dozen === 1 ? '1st 12' : dozen === 2 ? '2nd 12' : '3rd 12';

this.activeBets.push({
  type: 'dozen',
  value: dozen,
  amount: this.currentBet,
  label: dozenLabel,
});


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

const totalBet = this.currentBetTotal;
const winnerIndex = Math.floor(Math.random() * this.wheelNumbers.length);
const winningNumber = this.wheelNumbers[winnerIndex];

this.balance -= totalBet;
this.isSpinning = true;
this.winningIndex = -1;
this.lastSpinResults = [];
this.totalSpinWin = 0;
this.showWinAnimation = false;
this.showLossAnimation = false;

this.cdr.detectChanges();

void firstValueFrom(this.userService.updateXp(this.userService.xp() + 10)).catch(() => {
  // XP should not block the spin.
});

await this.animateWheelToIndex(winnerIndex);
await this.determineWinner(winningNumber, winnerIndex);


}

private async animateWheelToIndex(winnerIndex: number): Promise<void> {
  const pocketAngle = (360 / this.wheelNumbers.length) * winnerIndex;
  const currentMod = this.normalizeAngle(this.wheelRotation);
  const desiredMod = this.normalizeAngle(360 - pocketAngle);

  let delta = desiredMod - currentMod;

  if (delta < 0) {
    delta += 360;
  }

  const fullSpins = 10 + Math.floor(Math.random() * 4);

  this.startRotation = this.wheelRotation;
  this.targetRotation = this.wheelRotation + fullSpins * 360 + delta;
  this.startTime = performance.now();

  return new Promise((resolve) => {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);

      const easedProgress = this.easeOutSlowFinish(progress);

      this.wheelRotation =
        this.startRotation + (this.targetRotation - this.startRotation) * easedProgress;

      this.setWheelRotation(this.wheelRotation);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
        return;
      }

      this.wheelRotation = this.targetRotation;
      this.setWheelRotation(this.wheelRotation);
      this.animationId = null;

      setTimeout(() => {
        resolve();
      }, 450);
    };

    this.animationId = requestAnimationFrame(animate);
  });
}

private easeOutSlowFinish(progress: number): number {
  return 1 - Math.pow(1 - progress, 4.8);
}

private setWheelRotation(rotation: number): void {
const wheel = this.wheelElement?.nativeElement;


if (!wheel) {
  return;
}

wheel.style.transform = `rotate(${rotation}deg)`;


}

private normalizeAngle(angle: number): number {
return ((angle % 360) + 360) % 360;
}


private async determineWinner(winningNumber: number, winnerIndex: number): Promise<void> {
this.winningIndex = winnerIndex;


const winningColor = this.getNumberColor(winningNumber);
const winningColorName =
  winningColor === '#b91c1c' ? 'Red' : winningColor === '#050509' ? 'Black' : 'Green';

const spinResults: SpinResult[] = [];
let totalPayout = 0;

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
        (bet.value === 'red' && winningColor === '#b91c1c') ||
        (bet.value === 'black' && winningColor === '#050509')
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
  totalPayout += winAmount;

  spinResults.push({
    betLabel: bet.label,
    betAmount: bet.amount,
    won,
    winAmount,
  });
}

const totalBet = this.activeBets.reduce((sum, bet) => sum + bet.amount, 0);
const bonus = Math.floor(totalPayout * 0.1);
const finalPayout = totalPayout + bonus;
const netProfit = finalPayout - totalBet;
const updatedFinalBalance = this.balance + finalPayout;

try {
  const updatedUser = await firstValueFrom(this.userService.updateCoins(updatedFinalBalance));
  this.balance = updatedUser.coins;
  this.saveGameHistory(totalBet, finalPayout);
} catch (error) {
  console.error(error);
  this.alertService.error('Could not save roulette result.');
  this.isSpinning = false;
  return;
}

this.lastSpinResults = spinResults;
this.totalSpinWin = netProfit;

const newResult: Result = {
  number: winningNumber,
  color: winningColor,
  colorName: winningColorName,
};

this.resultsHistory.unshift(newResult);

if (this.resultsHistory.length > 15) {
  this.resultsHistory.pop();
}

if (finalPayout > 0) {
  this.lastWin = finalPayout;
  this.lastLoss = 0;
  this.showWinAnimation = true;
  this.alertService.success(
    `You won ${finalPayout} EC${bonus > 0 ? ` (+${bonus} bonus)` : ''}`,
  );

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

this.cdr.detectChanges();

setTimeout(() => {
  this.winningIndex = -1;
  this.cdr.detectChanges();
}, 1800);

setTimeout(() => {
  if (this.lastSpinResults.length > 0) {
    this.lastSpinResults = [];
    this.cdr.detectChanges();
  }
}, 8000);


}

private saveGameHistory(totalBet: number, totalPayout: number): void {
const user = this.userService.currentUser?.() ?? null;


if (!user) {
  return;
}

const profit = totalPayout - totalBet;
const won = profit > 0;

void firstValueFrom(
  this.leaderboardService.saveGameHistory({
    userId: user.id,
    gameName: 'Roulette',
    result: won ? 'win' : 'loss',
    betAmount: totalBet,
    coinsWon: won ? profit : 0,
    coinsLost: won ? 0 : Math.abs(profit),
  }),
)
  .then(() => {
    if (won) {
      this.mysteryBoxService.applyBuffToWin(user.id, 'Roulette', totalBet);
    }
  })
  .catch((error) => {
    console.error('Could not save Roulette game history', error);
  });


}

private canPlaceBet(): boolean {
if (this.isSpinning) {
return false;
}


if (this.currentBet <= 0) {
  return false;
}

return this.currentBet <= this.balance - this.currentBetTotal;


}

private notifyBetBlocked(): void {
if (this.isSpinning) {
this.alertService.info('Wait for the current spin to finish.');
return;
}


this.alertService.error('Not enough coins available.');


}

goBack(): void {
if (this.animationId !== null) {
cancelAnimationFrame(this.animationId);
}


this.restoreGlobalChrome();
this.router.navigate(['/home']);


}

private hideGlobalChrome(): void {
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
