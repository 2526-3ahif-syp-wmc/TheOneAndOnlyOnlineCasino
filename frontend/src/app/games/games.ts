import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GameTile {
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  players: number;
  accent: string;
  coverImage: string;
  route: string;
}

interface GameRow {
  title: string;
  description: string;
  games: GameTile[];
}

@Component({
  selector: 'app-games-overview',
  imports: [RouterLink],
  templateUrl: './games.html',
  styleUrl: './games.scss',
})
export class Games {
  readonly blackjack: GameTile = {
    title: 'Blackjack',
    subtitle: 'Beat the dealer',
    badge: 'Popular',
    icon: '♠',
    players: 128,
    accent: 'gold',
    coverImage: '/pics/blackjack.jpeg',
    route: '/games/blackjack',
  };

  readonly mines: GameTile = {
    title: 'Mines',
    subtitle: 'Risk every tile',
    badge: 'Hot',
    icon: '✦',
    players: 94,
    accent: 'violet',
    coverImage: '/pics/mines.jpeg',
    route: '/games/mines',
  };

  readonly slots: GameTile = {
    title: 'Slot Machine',
    subtitle: 'Spin for coins',
    badge: 'Fast',
    icon: '★',
    players: 211,
    accent: 'cyan',
    coverImage: '/pics/slot-mashine.jpeg',
    route: '/games/slots',
  };

  readonly roulette: GameTile = {
    title: 'Roulette',
    subtitle: 'Follow the wheel',
    badge: 'Classic',
    icon: '●',
    players: 76,
    accent: 'red',
    coverImage: '/pics/roulette.jpeg',
    route: '/games/roulette',
  };

  readonly plinko: GameTile = {
    title: 'Plinko',
    subtitle: 'Drop and win',
    badge: 'New',
    icon: '◆',
    players: 63,
    accent: 'emerald',
    coverImage: '/pics/plinko.jpeg',
    route: '/games/plinko',
  };

  readonly gameRows: GameRow[] = [
    {
      title: 'Continue playing',
      description: 'Jump back into the games you played recently.',
      games: [this.blackjack, this.mines, this.slots],
    },
    {
      title: 'Favorite games',
      description: 'Your most played EduBet tables and quick rounds.',
      games: [this.blackjack, this.roulette, this.plinko],
    },
    {
      title: 'Popular right now',
      description: 'Games with the most active players in the lobby.',
      games: [this.slots, this.blackjack, this.mines, this.roulette, this.plinko],
    },
    {
      title: 'High risk, high reward',
      description: 'Fast games with bigger swings and more tension.',
      games: [this.mines, this.plinko, this.slots],
    },
  ];
}