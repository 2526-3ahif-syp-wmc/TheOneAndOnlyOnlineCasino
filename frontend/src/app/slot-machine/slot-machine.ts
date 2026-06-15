import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertService } from '../services/alert-service';
import { UserService } from '../services/user-service';
import { LeaderboardService } from '../services/leaderboard-service';
import { MysteryBoxService } from '../services/mystery-box-service';

type PayoutTable = {
3: number;
4: number;
5: number;
};

type SlotSymbol = {
key: string;
label: string;
icon: string;
imageUrl: string;
weight: number;
payouts: PayoutTable;
isWild?: boolean;
isScatter?: boolean;
};

type SlotLine = {
label: string;
rows: number[];
};

type WinningLine = {
label: string;
symbol: SlotSymbol;
matchCount: number;
payout: number;
cells: Array<{ column: number; row: number }>;
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

type GambleColor = 'red' | 'black';

type GambleCard = {
color: GambleColor;
suit: string;
rank: string;
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

const REEL_COUNT = 5;
const ROW_COUNT = 3;

const SLOT_SYMBOLS: SlotSymbol[] = [
{
key: 'explorer',
label: 'Explorer',
icon: '🧭',
imageUrl: '/slots/explorer.png',
weight: 3,
payouts: { 3: 4, 4: 12, 5: 45 },
},
{
key: 'book',
label: 'Book',
icon: '📘',
imageUrl: '/slots/book.png',
weight: 4,
payouts: { 3: 3, 4: 10, 5: 35 },
isWild: true,
},
{
key: 'scatter',
label: 'Scatter',
icon: '★',
imageUrl: '/slots/scatter.png',
weight: 5,
payouts: { 3: 2, 4: 8, 5: 30 },
isScatter: true,
},
{
key: 'scarab',
label: 'Scarab',
icon: '🪲',
imageUrl: '/slots/scarab.png',
weight: 8,
payouts: { 3: 2, 4: 6, 5: 18 },
},
{
key: 'crown',
label: 'Crown',
icon: '♛',
imageUrl: '/slots/crown.png',
weight: 10,
payouts: { 3: 1.5, 4: 4, 5: 12 },
},
{
key: 'diamond',
label: 'Diamond',
icon: '♦',
imageUrl: '/slots/diamond.png',
weight: 13,
payouts: { 3: 1.2, 4: 3, 5: 9 },
},
{
key: 'coin',
label: 'Coin',
icon: '●',
imageUrl: '/slots/coin.png',
weight: 17,
payouts: { 3: 1, 4: 2.5, 5: 7 },
},
{
key: 'ace',
label: 'Ace',
icon: 'A',
imageUrl: '/slots/ace.png',
weight: 22,
payouts: { 3: 0.8, 4: 2, 5: 5 },
},
{
key: 'king',
label: 'King',
icon: 'K',
imageUrl: '/slots/king.png',
weight: 24,
payouts: { 3: 0.7, 4: 1.8, 5: 4 },
},
{
key: 'queen',
label: 'Queen',
icon: 'Q',
imageUrl: '/slots/queen.png',
weight: 26,
payouts: { 3: 0.6, 4: 1.5, 5: 3 },
},
];

const SLOT_LINE_DEFS: SlotLine[] = [
{ label: 'Middle', rows: [1, 1, 1, 1, 1] },
{ label: 'Top', rows: [0, 0, 0, 0, 0] },
{ label: 'Bottom', rows: [2, 2, 2, 2, 2] },
{ label: 'V', rows: [0, 1, 2, 1, 0] },
{ label: 'Reverse V', rows: [2, 1, 0, 1, 2] },
{ label: 'Down', rows: [0, 0, 1, 2, 2] },
{ label: 'Up', rows: [2, 2, 1, 0, 0] },
{ label: 'Small V', rows: [1, 0, 1, 2, 1] },
{ label: 'Small Reverse V', rows: [1, 2, 1, 0, 1] },
{ label: 'Zigzag', rows: [0, 1, 1, 1, 2] },
];

@Component({
selector: 'app-slot-machine',
standalone: true,
imports: [CommonModule, FormsModule, RouterLink],
templateUrl: './slot-machine.html',
styleUrls: ['./slot-machine.scss'],
})
export class SlotMachineComponent implements OnInit, OnDestroy {
private readonly userService = inject(UserService);
private readonly alertService = inject(AlertService);
private readonly leaderboardService = inject(LeaderboardService);
private readonly mysteryBoxService = inject(MysteryBoxService);


private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];

protected balance = this.userService.coins();
protected bet = 50;
protected isSpinning = false;
protected isGambling = false;
protected paytableOpen = false;

protected reels: SlotSymbol[][] = this.createGrid();
protected spinColumns: SlotSymbol[][] = this.createSpinColumns();
protected spinningReelIndexes = new Set<number>();

protected recentSpins: SpinHistoryEntry[] = [];
protected lastSpin: {
	payout: number;
	winningLines: WinningLine[];
	winningCellKeys: Set<string>;
} | null = null;

protected canGamble = false;
protected gambleAmount = 0;
protected gambleRound = 0;
protected lastGambleCard: GambleCard | null = null;

protected confettiParticles: ConfettiParticle[] = [];
protected readonly quickBets = [25, 50, 100, 250, 500];
protected readonly maxGambleRounds = 5;

protected readonly paytable: SlotSymbol[] = [
	this.findSymbol('explorer'),
	this.findSymbol('book'),
	this.findSymbol('scatter'),
	this.findSymbol('scarab'),
	this.findSymbol('crown'),
	this.findSymbol('diamond'),
	this.findSymbol('coin'),
	this.findSymbol('ace'),
	this.findSymbol('king'),
	this.findSymbol('queen'),
];

private readonly xpReward = 8;
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
	this.clearConfetti();
	this.restoreGlobalChrome();
}

protected setQuickBet(amount: number): void {
	this.bet = Math.min(amount, Math.max(1, this.balance));
}

protected openPaytable(): void {
	this.paytableOpen = true;
}

protected closePaytable(): void {
	this.paytableOpen = false;
}

protected get canSpin(): boolean {
	return !this.isSpinning && !this.isGambling && !this.canGamble && this.bet > 0 && this.bet <= this.balance;
}

protected get canUseDouble(): boolean {
	return !this.isSpinning && !this.isGambling && this.canGamble && this.gambleAmount > 0;
}

protected get currentStatusLabel(): string {
	if (this.isSpinning) {
		return 'Spinning';
	}

	if (this.isGambling) {
		return 'Gamble';
	}

	if (this.canGamble) {
		return 'Double?';
	}

	if ((this.lastSpin?.payout ?? 0) > 0) {
		return 'Won';
	}

	return 'Ready';
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

	return `${bestLine.label} • ${bestLine.matchCount}x ${bestLine.symbol.label}`;
}

protected get totalPossibleLines(): number {
	return SLOT_LINE_DEFS.length;
}

protected getDisplayColumn(columnIndex: number): SlotSymbol[] {
	if (this.isReelSpinning(columnIndex)) {
		return this.spinColumns[columnIndex];
	}

	return this.reels[columnIndex];
}

protected isReelSpinning(columnIndex: number): boolean {
	return this.spinningReelIndexes.has(columnIndex);
}

protected spinDurationFor(columnIndex: number): number {
	return 520 + columnIndex * 55;
}

protected handleSymbolImageError(event: Event): void {
	const image = event.target as HTMLImageElement;
	image.style.display = 'none';
}

protected async spinSlots(): Promise<void> {
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
	this.canGamble = false;
	this.gambleAmount = 0;
	this.gambleRound = 0;
	this.lastGambleCard = null;
	this.lastSpin = null;

	this.spinColumns = this.createSpinColumns();
	this.spinningReelIndexes = new Set([0, 1, 2, 3, 4]);

	void firstValueFrom(this.userService.addXp(this.xpReward)).catch(() => {
		// XP should not block the spin if the backend temporarily fails.
	});

	const finalGrid = this.createGrid();
	const stopDelays = [850, 1120, 1390, 1660, 1980];

	stopDelays.forEach((delay, columnIndex) => {
		const timeoutId = window.setTimeout(() => {
			this.stopReel(columnIndex, finalGrid[columnIndex]);
		}, delay);

		this.timeoutIds.push(timeoutId);
	});

	const completionTimeoutId = window.setTimeout(async () => {
		this.clearSpinTimers();
		this.reels = finalGrid;
		this.spinningReelIndexes = new Set();

		const evaluation = this.evaluateGrid(finalGrid, wager);
		const nextBalance = Math.max(0, Math.floor(this.balance - wager + evaluation.payout));

		try {
			await this.updateBalance(nextBalance);
			this.saveGameHistory('Slot Machine', wager, evaluation.payout, evaluation.payout > 0);
		} catch (error: any) {
			console.error('updateCoins failed', error);

			const status = error?.status;
			const bodyMsg = error?.error?.message ?? error?.message ?? 'Unknown error';

			this.alertService.error(
				`Could not save the slot result${status ? ' (status ' + status + ')' : ''}: ${bodyMsg}`
			);

			this.isSpinning = false;
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
			this.canGamble = true;
			this.gambleAmount = evaluation.payout;
			this.spawnConfetti();
			this.alertService.success(`You won ${evaluation.payout} EC`);
		} else {
			this.alertService.info('No win this spin');
		}
	}, stopDelays[stopDelays.length - 1] + 180);

	this.timeoutIds.push(completionTimeoutId);
}

protected async gambleDouble(guess: GambleColor): Promise<void> {
	if (!this.canUseDouble) {
		return;
	}

	const user = this.userService.currentUser?.() ?? null;

	if (!user) {
		this.alertService.error('You must be logged in to gamble');
		return;
	}

	const currentGambleAmount = Math.floor(this.gambleAmount);

	if (currentGambleAmount <= 0) {
		return;
	}

	this.isGambling = true;

	const drawnCard = this.drawGambleCard();
	this.lastGambleCard = drawnCard;

	const guessedCorrectly = drawnCard.color === guess;

	try {
		if (guessedCorrectly) {
			await this.updateBalance(this.balance + currentGambleAmount);
			this.saveGameHistory('Slot Double', currentGambleAmount, currentGambleAmount, true);

			this.gambleRound++;
			this.gambleAmount = currentGambleAmount * 2;
			this.spawnConfetti();

			if (this.gambleRound >= this.maxGambleRounds) {
				this.alertService.success(`Correct! Max reached: ${this.gambleAmount} EC`);
				this.collectGamble();
			} else {
				this.alertService.success(`Correct! Now ${this.gambleAmount} EC`);
			}
		} else {
			await this.updateBalance(Math.max(0, this.balance - currentGambleAmount));
			this.saveGameHistory('Slot Double', currentGambleAmount, 0, false);

			this.canGamble = false;
			this.gambleAmount = 0;
			this.gambleRound = 0;

			this.alertService.error(`Wrong! It was ${drawnCard.color}`);
		}
	} catch (error) {
		console.error('Double gamble failed', error);
		this.alertService.error('Could not save the 2x gamble result');
	}

	this.isGambling = false;
}

protected collectGamble(): void {
	if (!this.canGamble) {
		return;
	}

	this.alertService.success(`Collected ${this.gambleAmount} EC`);
	this.canGamble = false;
	this.gambleAmount = 0;
	this.gambleRound = 0;
}

protected isWinningCell(columnIndex: number, rowIndex: number): boolean {
	return this.lastSpin?.winningCellKeys.has(`${columnIndex}:${rowIndex}`) ?? false;
}

private stopReel(columnIndex: number, finalColumn: SlotSymbol[]): void {
	const nextReels = this.reels.map(column => [...column]);
	nextReels[columnIndex] = finalColumn;

	this.reels = nextReels;

	this.spinningReelIndexes.delete(columnIndex);
	this.spinningReelIndexes = new Set(this.spinningReelIndexes);
}

private async updateBalance(nextBalance: number): Promise<void> {
	const updatedUser = await firstValueFrom(this.userService.updateCoins(nextBalance));
	this.balance = updatedUser.coins;
}

private saveGameHistory(gameName: string, wager: number, payout: number, won: boolean): void {
	const user = this.userService.currentUser?.() ?? null;

	if (!user) {
		return;
	}

	void firstValueFrom(
		this.leaderboardService.saveGameHistory({
			userId: user.id,
			gameName,
			result: won ? 'win' : 'loss',
			betAmount: wager,
			coinsWon: won ? payout : 0,
			coinsLost: won ? 0 : wager,
		})
	).then(() => {
		if (won && gameName === 'Slot Machine') {
			this.mysteryBoxService.applyBuffToWin(user.id, 'Slot Machine', wager);
		}
	}).catch(error => {
		console.error('Could not save Slot Machine game history', error);
	});
}

private drawGambleCard(): GambleCard {
	const redSuits = ['♥', '♦'];
	const blackSuits = ['♠', '♣'];
	const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

	const color: GambleColor = Math.random() < 0.5 ? 'red' : 'black';
	const suits = color === 'red' ? redSuits : blackSuits;

	return {
		color,
		suit: suits[Math.floor(Math.random() * suits.length)],
		rank: ranks[Math.floor(Math.random() * ranks.length)],
	};
}

private createGrid(): SlotSymbol[][] {
	return Array.from({ length: REEL_COUNT }, () => this.createColumn());
}

private createColumn(): SlotSymbol[] {
	return Array.from({ length: ROW_COUNT }, () => this.pickSymbol());
}

private createSpinColumns(): SlotSymbol[][] {
	return Array.from({ length: REEL_COUNT }, () =>
		Array.from({ length: 40 }, () => this.pickSymbol())
	);
}

private pickSymbol(): SlotSymbol {
	const totalWeight = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
	const roll = Math.random() * totalWeight;

	let cursor = 0;

	for (const symbol of SLOT_SYMBOLS) {
		cursor += symbol.weight;

		if (roll < cursor) {
			return symbol;
		}
	}

	return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

private evaluateGrid(grid: SlotSymbol[][], wager: number): SpinEvaluation {
	const winningLines: WinningLine[] = [];
	const winningCellKeys = new Set<string>();

	for (const line of SLOT_LINE_DEFS) {
		const lineSymbols = line.rows.map((row, column) => grid[column][row]);
		const result = this.evaluateLine(line, lineSymbols, wager);

		if (!result) {
			continue;
		}

		winningLines.push(result);

		for (const cell of result.cells) {
			winningCellKeys.add(`${cell.column}:${cell.row}`);
		}
	}

	const scatterResult = this.evaluateScatters(grid, wager);

	if (scatterResult) {
		winningLines.push(scatterResult);

		for (const cell of scatterResult.cells) {
			winningCellKeys.add(`${cell.column}:${cell.row}`);
		}
	}

	const payout = winningLines.reduce((sum, line) => sum + line.payout, 0);

	return {
		payout,
		winningLines,
		winningCellKeys,
	};
}

private evaluateLine(line: SlotLine, lineSymbols: SlotSymbol[], wager: number): WinningLine | null {
	let baseSymbol: SlotSymbol | null = null;
	let matchCount = 0;
	const cells: Array<{ column: number; row: number }> = [];

	for (let column = 0; column < lineSymbols.length; column++) {
		const symbol = lineSymbols[column];

		if (symbol.isScatter) {
			break;
		}

		if (!baseSymbol && !symbol.isWild) {
			baseSymbol = symbol;
		}

		if (!baseSymbol) {
			matchCount++;
			cells.push({ column, row: line.rows[column] });
			continue;
		}

		if (symbol.key === baseSymbol.key || symbol.isWild) {
			matchCount++;
			cells.push({ column, row: line.rows[column] });
			continue;
		}

		break;
	}

	if (!baseSymbol && matchCount > 0) {
		baseSymbol = this.findSymbol('book');
	}

	if (!baseSymbol || matchCount < 3) {
		return null;
	}

	const cappedMatchCount = Math.min(5, matchCount) as 3 | 4 | 5;
	const multiplier = baseSymbol.payouts[cappedMatchCount];
	const payout = Math.floor(wager * multiplier);

	if (payout <= 0) {
		return null;
	}

	return {
		label: line.label,
		symbol: baseSymbol,
		matchCount: cappedMatchCount,
		payout,
		cells,
	};
}

private evaluateScatters(grid: SlotSymbol[][], wager: number): WinningLine | null {
	const cells: Array<{ column: number; row: number }> = [];

	for (let column = 0; column < REEL_COUNT; column++) {
		for (let row = 0; row < ROW_COUNT; row++) {
			if (grid[column][row].isScatter) {
				cells.push({ column, row });
			}
		}
	}

	if (cells.length < 3) {
		return null;
	}

	const scatter = this.findSymbol('scatter');
	const cappedMatchCount = Math.min(5, cells.length) as 3 | 4 | 5;
	const payout = Math.floor(wager * scatter.payouts[cappedMatchCount]);

	return {
		label: `${cappedMatchCount}x Scatter`,
		symbol: scatter,
		matchCount: cappedMatchCount,
		payout,
		cells,
	};
}

private findSymbol(key: string): SlotSymbol {
	return SLOT_SYMBOLS.find(symbol => symbol.key === key) ?? SLOT_SYMBOLS[0];
}

private clearSpinTimers(): void {
	for (const timeoutId of this.timeoutIds) {
		clearTimeout(timeoutId);
	}

	this.timeoutIds = [];
}

private spawnConfetti(): void {
	this.clearConfetti();

	const colors = ['#f8d76b', '#7c3aed', '#22d3ee', '#f472b6', '#34d399', '#fb7185'];

	this.confettiParticles = Array.from({ length: 34 }, (_, index) => ({
		id: ++this.confettiCounter,
		left: 8 + Math.random() * 84,
		delay: Math.random() * 140,
		duration: 1200 + Math.random() * 800,
		offsetX: -220 + Math.random() * 440,
		offsetY: 160 + Math.random() * 260,
		rotate: -220 + Math.random() * 440,
		color: colors[index % colors.length],
		size: 7 + Math.random() * 8,
	}));

	this.confettiTimeoutId = window.setTimeout(() => {
		this.confettiParticles = [];
		this.confettiTimeoutId = null;
	}, 2400);
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
