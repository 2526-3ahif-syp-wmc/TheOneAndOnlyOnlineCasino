import { CommonModule } from '@angular/common';
import {
Component,
ElementRef,
OnDestroy,
OnInit,
ViewChild,
inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertService } from '../services/alert-service';
import { UserService } from '../services/user-service';
import { LeaderboardService } from '../services/leaderboard-service';
import { MysteryBoxService } from '../services/mystery-box-service';

type RiskLevel = 'low' | 'medium' | 'high';

type Pin = {
id: string;
left: number;
top: number;
};

type MultiplierSlot = {
index: number;
multiplier: number;
glow: string;
};

type DropPathPoint = {
x: number;
y: number;
pinId?: string;
};

type DropResult = {
id: number;
risk: RiskLevel;
bet: number;
payout: number;
profit: number;
multiplier: number;
slotIndex: number;
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

const ROWS = 10;

const MULTIPLIERS: Record<RiskLevel, number[]> = {
low: [4, 2, 1.4, 1.1, 0.8, 0.5, 0.8, 1.1, 1.4, 2, 4],
medium: [12, 5, 2.2, 1.4, 0.7, 0.3, 0.7, 1.4, 2.2, 5, 12],
high: [45, 15, 5, 2, 0.4, 0, 0.4, 2, 5, 15, 45],
};

@Component({
selector: 'app-plinko',
standalone: true,
imports: [CommonModule, FormsModule, RouterLink],
templateUrl: './plinko.html',
styleUrls: ['./plinko.scss'],
})
export class PlinkoComponent implements OnInit, OnDestroy {
@ViewChild('plinkoBall')
private plinkoBall?: ElementRef<HTMLDivElement>;


private readonly userService = inject(UserService);
private readonly alertService = inject(AlertService);
private readonly leaderboardService = inject(LeaderboardService);
private readonly mysteryBoxService = inject(MysteryBoxService);

private hiddenChrome: Array<{ element: HTMLElement; previousDisplay: string }> = [];

protected balance = this.userService.coins();
protected bet = 50;
protected risk: RiskLevel = 'medium';
protected isDropping = false;

protected ballVisible = false;
protected ballX = 50;
protected ballY = 5;
protected ballRotation = 0;
protected activePinId = '';

protected pins: Pin[] = this.createPins();
protected slots: MultiplierSlot[] = this.createSlots();

protected lastDrop: DropResult | null = null;
protected recentDrops: DropResult[] = [];
protected confettiParticles: ConfettiParticle[] = [];

protected readonly quickBets = [25, 50, 100, 250, 500];

private readonly xpReward = 8;
private dropCounter = 0;
private confettiCounter = 0;
private confettiTimeoutId: number | null = null;
private animationFrameId: number | null = null;
private pinTimeoutId: number | null = null;
private cancelled = false;

ngOnInit(): void {
	this.cancelled = false;
	this.balance = this.userService.coins();
	this.bet = Math.min(this.bet, Math.max(1, this.balance));
	this.hideGlobalChrome();
}

ngOnDestroy(): void {
	this.cancelled = true;

	if (this.animationFrameId !== null) {
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = null;
	}

	if (this.pinTimeoutId !== null) {
		clearTimeout(this.pinTimeoutId);
		this.pinTimeoutId = null;
	}

	this.clearConfetti();
	this.restoreGlobalChrome();
}

protected get canDrop(): boolean {
	return !this.isDropping && this.bet > 0 && this.bet <= this.balance;
}

protected get currentStatusLabel(): string {
	if (this.isDropping) {
		return 'Dropping';
	}

	if (!this.lastDrop) {
		return 'Ready';
	}

	if (this.lastDrop.profit > 0) {
		return 'Won';
	}

	if (this.lastDrop.profit === 0) {
		return 'Break Even';
	}

	return 'Lost';
}

protected get currentRiskLabel(): string {
	return this.risk.charAt(0).toUpperCase() + this.risk.slice(1);
}

protected setQuickBet(amount: number): void {
	this.bet = Math.min(amount, Math.max(1, this.balance));
}

protected setRisk(risk: RiskLevel): void {
	this.risk = risk;
	this.slots = this.createSlots();
}

protected async dropBall(): Promise<void> {
	if (this.isDropping) {
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

	this.clearConfetti();

	this.isDropping = true;
	this.ballVisible = true;
	this.ballX = 50;
	this.ballY = 5;
	this.ballRotation = 0;
	this.activePinId = '';
	this.lastDrop = null;

	await this.waitForBallElement();
	this.moveBallElement(50, 5, 0);

	void firstValueFrom(this.userService.addXp(this.xpReward)).catch(() => {
		// XP should not block the drop if the backend temporarily fails.
	});

	const path = this.createDropPath();

	await this.animateBallPath(path.points);

	if (this.cancelled) {
		return;
	}

	const multiplier = MULTIPLIERS[this.risk][path.slotIndex];
	const payout = Math.floor(wager * multiplier);
	const profit = payout - wager;
	const nextBalance = Math.max(0, Math.floor(this.balance - wager + payout));

	try {
		await this.updateBalance(nextBalance);
		this.saveGameHistory(wager, payout, profit);
	} catch (error: any) {
		console.error('Plinko updateCoins failed', error);

		const status = error?.status;
		const bodyMsg = error?.error?.message ?? error?.message ?? 'Unknown error';

		this.alertService.error(
			`Could not save the Plinko result${status ? ' (status ' + status + ')' : ''}: ${bodyMsg}`
		);

		this.isDropping = false;
		this.ballVisible = false;
		return;
	}

	const result: DropResult = {
		id: ++this.dropCounter,
		risk: this.risk,
		bet: wager,
		payout,
		profit,
		multiplier,
		slotIndex: path.slotIndex,
	};

	this.lastDrop = result;
	this.recentDrops = [result, ...this.recentDrops].slice(0, 6);

	this.isDropping = false;

	if (profit > 0) {
		this.spawnConfetti();
		this.alertService.success(`You won ${profit} EC`);
	} else if (profit === 0) {
		this.alertService.info('Break even');
	} else {
		this.alertService.info(`You lost ${Math.abs(profit)} EC`);
	}

	await this.sleep(650);
	this.ballVisible = false;
	this.activePinId = '';
}

private createDropPath(): {
	slotIndex: number;
	points: DropPathPoint[];
} {
	let slotIndex = 0;

	const points: DropPathPoint[] = [
		{
			x: 50,
			y: 6,
		},
	];

	for (let row = 0; row < ROWS; row++) {
		const goesRight = Math.random() >= 0.5;

		if (goesRight) {
			slotIndex++;
		}

		const centerOffset = slotIndex - (row + 1) / 2;
		const targetX = this.clamp(50 + centerOffset * 8.3, 7, 93);
		const targetY = 14 + row * 7.2;

		const previousPoint = points[points.length - 1];

		const bounceX = this.clamp(
			(previousPoint.x + targetX) / 2 + (goesRight ? 1.7 : -1.7),
			7,
			93
		);

		const bounceY = targetY - 2.8;

		points.push(
			{
				x: bounceX,
				y: bounceY,
			},
			{
				x: targetX,
				y: targetY,
				pinId: `${row}-${slotIndex}`,
			}
		);
	}

	points.push({
		x: 5 + slotIndex * 9,
		y: 90,
	});

	return {
		slotIndex,
		points,
	};
}

private async animateBallPath(points: DropPathPoint[]): Promise<void> {
	for (let index = 1; index < points.length; index++) {
		if (this.cancelled) {
			return;
		}

		const from = points[index - 1];
		const to = points[index];

		const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
		const duration = this.clamp(80 + distance * 8, 105, 165);

		await this.animateBallSegment(from, to, duration);

		if (to.pinId) {
			this.flashPin(to.pinId);
		}
	}
}

private animateBallSegment(from: DropPathPoint, to: DropPathPoint, duration: number): Promise<void> {
	return new Promise(resolve => {
		const startedAt = performance.now();

		const step = (now: number) => {
			if (this.cancelled) {
				resolve();
				return;
			}

			const progress = this.clamp((now - startedAt) / duration, 0, 1);
			const eased = this.easeInOut(progress);
			const bounceArc = Math.sin(progress * Math.PI) * -1.15;

			const x = from.x + (to.x - from.x) * eased;
			const y = from.y + (to.y - from.y) * eased + bounceArc;

			this.ballRotation += (to.x - from.x) * 1.45;
			this.ballX = x;
			this.ballY = y;

			this.moveBallElement(x, y, this.ballRotation);

			if (progress < 1) {
				this.animationFrameId = requestAnimationFrame(step);
				return;
			}

			this.ballX = to.x;
			this.ballY = to.y;
			this.moveBallElement(to.x, to.y, this.ballRotation);

			resolve();
		};

		this.animationFrameId = requestAnimationFrame(step);
	});
}

private moveBallElement(x: number, y: number, rotation: number): void {
	const element = this.plinkoBall?.nativeElement;

	if (!element) {
		return;
	}

	element.style.left = `${x}%`;
	element.style.top = `${y}%`;
	element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}

private easeInOut(value: number): number {
	if (value < 0.5) {
		return 2 * value * value;
	}

	return 1 - Math.pow(-2 * value + 2, 2) / 2;
}

private flashPin(pinId: string): void {
	this.activePinId = pinId;

	if (this.pinTimeoutId !== null) {
		clearTimeout(this.pinTimeoutId);
	}

	this.pinTimeoutId = window.setTimeout(() => {
		if (this.activePinId === pinId) {
			this.activePinId = '';
		}

		this.pinTimeoutId = null;
	}, 120);
}

private createPins(): Pin[] {
	const pins: Pin[] = [];

	for (let row = 0; row < ROWS; row++) {
		const pinCount = row + 2;
		const spacing = 8.3;
		const start = 50 - ((pinCount - 1) * spacing) / 2;
		const top = 14 + row * 7.2;

		for (let col = 0; col < pinCount; col++) {
			pins.push({
				id: `${row}-${col}`,
				left: start + col * spacing,
				top,
			});
		}
	}

	return pins;
}

private createSlots(): MultiplierSlot[] {
	return MULTIPLIERS[this.risk].map((multiplier, index) => ({
		index,
		multiplier,
		glow: this.getSlotGlow(multiplier),
	}));
}

private getSlotGlow(multiplier: number): string {
	if (multiplier >= 10) {
		return 'rgba(248, 215, 107, 0.65)';
	}

	if (multiplier >= 2) {
		return 'rgba(168, 85, 247, 0.55)';
	}

	if (multiplier >= 1) {
		return 'rgba(34, 211, 238, 0.45)';
	}

	return 'rgba(239, 68, 68, 0.42)';
}

private async updateBalance(nextBalance: number): Promise<void> {
	const updatedUser = await firstValueFrom(this.userService.updateCoins(nextBalance));
	this.balance = updatedUser.coins;
}

private saveGameHistory(wager: number, payout: number, profit: number): void {
	const user = this.userService.currentUser?.() ?? null;

	if (!user) {
		return;
	}

	const won = profit > 0;

	void firstValueFrom(
		this.leaderboardService.saveGameHistory({
			userId: user.id,
			gameName: 'Plinko',
			result: won ? 'win' : 'loss',
			betAmount: wager,
			coinsWon: won ? profit : 0,
			coinsLost: won ? 0 : Math.abs(profit),
		})
	).then(() => {
		if (won) {
			this.mysteryBoxService.applyBuffToWin(user.id, 'Plinko', wager);
		}
	}).catch(error => {
		console.error('Could not save Plinko game history', error);
	});
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

private clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

private sleep(ms: number): Promise<void> {
	return new Promise(resolve => window.setTimeout(resolve, ms));
}

private async waitForBallElement(): Promise<void> {
	for (let attempt = 0; attempt < 8; attempt++) {
		if (this.plinkoBall?.nativeElement) {
			return;
		}

		await this.sleep(0);
	}
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
