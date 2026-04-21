import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GameCard {
  title: string;
  subtitle: string;
  description: string;
  edge: string;
  volatility: string;
  pace: string;
  badge: string;
  accent: string;
  tags: string[];
}

@Component({
  selector: 'app-games-overview',
  imports: [RouterLink],
  templateUrl: './games.html',
  styleUrl: './games.scss',
})
export class Games {
  readonly stats = [
    { value: '5', label: 'Games ready' },
    { value: '24/7', label: 'Lobby access' },
    { value: '1 tap', label: 'To your table' },
  ];

  readonly games: GameCard[] = [
    {
      title: 'Blackjack',
      subtitle: 'Strategy first, low noise',
      description:
        'Beat the dealer with smart decisions, clean pacing and the most disciplined table in the lobby.',
      edge: 'Low',
      volatility: 'Medium',
      pace: 'Fast rounds',
      badge: 'Best control',
      accent: 'gold',
      tags: ['Hit or stand', 'Split hands', 'Double down'],
    },
    {
      title: 'Mines',
      subtitle: 'Risk in every step',
      description:
        'Reveal tiles, manage the multiplier and decide exactly how far you want to push the run.',
      edge: 'Variable',
      volatility: 'High',
      pace: 'Instant turns',
      badge: 'High tension',
      accent: 'violet',
      tags: ['Tile pressure', 'Multiplier climb', 'Cash-out timing'],
    },
    {
      title: 'Slot Machine',
      subtitle: 'Pure visual momentum',
      description:
        'Spin a polished reel layout with bright effects, rapid outcomes and a classic casino rhythm.',
      edge: 'Medium',
      volatility: 'Very high',
      pace: 'Single click',
      badge: 'Flashiest game',
      accent: 'cyan',
      tags: ['Reel bursts', 'Bonus symbols', 'Quick spins'],
    },
    {
      title: 'Roulette',
      subtitle: 'Table energy, elegant flow',
      description:
        'Place your bets, follow the wheel and keep the session moving with a refined classic setup.',
      edge: 'Low to medium',
      volatility: 'Medium',
      pace: 'Structured',
      badge: 'Classic table',
      accent: 'red',
      tags: ['Inside bets', 'Outside bets', 'Wheel suspense'],
    },
    {
      title: 'Plinko',
      subtitle: 'Drop, bounce, reward',
      description:
        'Send the ball through a field of pins and watch the path turn into a quick, readable result.',
      edge: 'Balanced',
      volatility: 'High',
      pace: 'Animated drops',
      badge: 'Best spectacle',
      accent: 'emerald',
      tags: ['Path chaos', 'Payout lanes', 'Replay value'],
    },
  ];

  readonly featuredGame = this.games[0];
}

