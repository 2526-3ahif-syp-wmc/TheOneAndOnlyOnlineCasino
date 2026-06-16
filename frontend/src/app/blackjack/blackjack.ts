import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BlackjackService, BlackjackGameDto } from '../services/blackjack-service';
import { UserService } from '../services/user-service';
import { LeaderboardService } from '../services/leaderboard-service';
import { AlertService } from '../services/alert-service';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blackjack.html',
  styleUrls: ['./blackjack.scss'],
})
export class BlackjackComponent implements OnInit {
  private blackjackService = inject(BlackjackService);
  private userService = inject(UserService);
  private leaderboardService = inject(LeaderboardService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  protected balance = signal(this.userService.coins());
  protected bet = 50;
  protected loading = signal(false);
  protected game = signal<BlackjackGameDto | null>(null);
  protected dealing = signal(false);
  protected readonly quickBets = [25, 50, 100, 250, 500];

  protected canDeal(): boolean {
    return !this.loading() && !this.dealing() && this.game()?.status !== 'playing';
  }

  protected canPlay(): boolean {
    return !this.loading() && !this.dealing() && this.game()?.status === 'playing';
  }

  ngOnInit(): void {
    this.balance.set(this.userService.coins());
  }

  async start() {
    if (!this.userService.isLoggedIn()) {
      this.alertService.error('You must be logged in to play');
      return;
    }

    if (!this.canDeal()) {
      this.alertService.info('Finish the current hand before dealing again');
      return;
    }

    if (this.bet <= 0 || this.bet > this.balance()) {
      this.alertService.error('Invalid bet amount');
      return;
    }

    this.loading.set(true);

    try {
      const user = this.userService.currentUser?.();

      if (!user) {
        this.alertService.error('No user logged in');
        return;
      }

      // deduct bet like other games (optimistic)
      const previous = this.userService.coins();
      const deducted = Math.max(0, previous - Math.floor(this.bet));
      await firstValueFrom(this.userService.updateCoins(deducted));

      const game$ = this.blackjackService.startGame(user.id, Math.floor(this.bet));
      const game = await firstValueFrom(game$);

      // animate deal
      this.dealing.set(true);
      await this.wait(600);
      this.dealing.set(false);

      this.game.set(game);
      // update local balance signal from service
      this.balance.set(this.userService.coins());
    } catch (err) {
      console.error(err);
      this.alertService.error('Could not start blackjack game');
    } finally {
      this.loading.set(false);
    }
  }

  async hit() {
    const g = this.game();

    if (!g) {
      return;
    }

    this.loading.set(true);

    try {
      const updated = await firstValueFrom(this.blackjackService.hit(g.id));

      // simple card reveal animation
      this.dealing.set(true);
      await this.wait(400);
      this.dealing.set(false);

      this.game.set(updated);

      if (updated.status === 'player_bust') {
        // player already had bet deducted at start; record loss
        await firstValueFrom(
          this.leaderboardService.saveGameHistory({
            userId: this.userService.currentUser?.()!.id,
            gameName: 'Blackjack',
            result: 'loss',
            betAmount: g.bet,
            coinsWon: 0,
            coinsLost: g.bet,
          }),
        );

        this.alertService.info('Busted! You lost.');
      }

      if (updated.status !== 'playing') {
        this.balance.set(this.userService.coins());
      }
    } catch (err) {
      console.error(err);
      this.alertService.error('Hit failed');
    } finally {
      this.loading.set(false);
    }
  }

  async stand() {
    const g = this.game();

    if (!g) {
      return;
    }

    this.loading.set(true);

    try {
      const updated = await firstValueFrom(this.blackjackService.stand(g.id));

      // dealer animation
      this.dealing.set(true);
      await this.wait(800);
      this.dealing.set(false);

      this.game.set(updated);

      // determine result and update leaderboard + coins
      const result = updated.status;
      if (result === 'player_win' || result === 'dealer_bust') {
        // award 1:1 payout (return bet + winnings equal to bet)
        const newBalance = this.userService.coins() + updated.bet * 2;
        await firstValueFrom(this.userService.updateCoins(newBalance));
        await firstValueFrom(
          this.leaderboardService.saveGameHistory({
            userId: this.userService.currentUser?.()!.id,
            gameName: 'Blackjack',
            result: 'win',
            betAmount: updated.bet,
            coinsWon: updated.bet,
            coinsLost: 0,
          }),
        );
        this.alertService.success('You win!');
      } else if (result === 'push') {
        // push: refund bet
        const refund = this.userService.coins() + updated.bet;
        await firstValueFrom(this.userService.updateCoins(refund));
        this.alertService.info('Push - tie');
      } else {
        // loss: bet already deducted
        await firstValueFrom(
          this.leaderboardService.saveGameHistory({
            userId: this.userService.currentUser?.()!.id,
            gameName: 'Blackjack',
            result: 'loss',
            betAmount: updated.bet,
            coinsWon: 0,
            coinsLost: updated.bet,
          }),
        );
        this.alertService.info('You lost');
      }

      this.balance.set(this.userService.coins());
    } catch (err) {
      console.error(err);
      this.alertService.error('Stand failed');
    } finally {
      this.loading.set(false);
    }
  }

  formatCard(card: any): string {
    if (!card) return '';
    return `${card.rank}${card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'spades' ? '♠' : '♣'}`;
  }

  protected getHandValue(hand: { rank: string; value: number }[] | undefined | null): number {
    if (!hand) {
      return 0;
    }

    let total = 0;
    let aces = 0;

    for (const card of hand) {
      total += card.value;

      if (card.rank === 'A') {
        aces += 1;
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }

  protected getCardSuitSymbol(suit: string): string {
    if (suit === 'hearts') {
      return '♥';
    }

    if (suit === 'diamonds') {
      return '♦';
    }

    if (suit === 'spades') {
      return '♠';
    }

    return '♣';
  }

  protected isRedSuit(suit: string): boolean {
    return suit === 'hearts' || suit === 'diamonds';
  }

  protected handLabel(kind: 'dealer' | 'player'): string {
    if (!this.game()) {
      return kind === 'dealer' ? 'Waiting for deal' : 'Ready to play';
    }

    return kind === 'dealer'
      ? `${this.getHandValue(this.game()?.dealerHand)} points`
      : `${this.getHandValue(this.game()?.playerHand)} points`;
  }

  protected statusLabel(): string {
    const current = this.game();

    if (!current) {
      return 'A table with a clean, premium casino feel';
    }

    if (current.status === 'player_bust') {
      return 'Bust. Dealer takes the hand.';
    }

    if (current.status === 'dealer_bust') {
      return 'Dealer busts. You win.';
    }

    if (current.status === 'player_win') {
      return 'Strong hand. You beat the dealer.';
    }

    if (current.status === 'dealer_win') {
      return 'Dealer wins this round.';
    }

    if (current.status === 'push') {
      return 'Push. Bet returned.';
    }

    return 'Your move. Hit or stand.';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
