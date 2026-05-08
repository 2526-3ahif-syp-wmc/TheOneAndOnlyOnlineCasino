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
    coverImage: '/blackjack.jpeg',
    route: '/games/blackjack',
  };

  readonly mines: GameTile = {
    title: 'Mines',
    subtitle: 'Risk every tile',
    badge: 'Hot',
    icon: '✦',
    players: 94,
    accent: 'violet',
    coverImage: '/mines.jpeg',
    route: '/games/mines',
  };

  readonly slots: GameTile = {
    title: 'Slot Machine',
    subtitle: 'Spin for coins',
    badge: 'Fast',
    icon: '★',
    players: 211,
    accent: 'cyan',
    coverImage: '/slot-mashine.jpeg',
    route: '/games/slots',
  };

  readonly roulette: GameTile = {
    title: 'Roulette',
    subtitle: 'Follow the wheel',
    badge: 'Classic',
    icon: '●',
    players: 76,
    accent: 'red',
    coverImage: '/roulette.jpeg',
    route: '/games/roulette',
  };

  readonly plinko: GameTile = {
    title: 'Plinko',
    subtitle: 'Drop and win',
    badge: 'New',
    icon: '◆',
    players: 63,
    accent: 'emerald',
    coverImage: '/plinko.jpeg',
    route: '/games/plinko',
  };

  // list of all game tiles for easy lookup
  readonly allGames: GameTile[] = [
    this.blackjack,
    this.mines,
    this.slots,
    this.roulette,
    this.plinko,
  ];

  private favoritesKey = 'edubet.favorites';
  favorites: string[] = [];
  private lastPlayedKey = 'edubet.lastplayed';
  lastPlayed: string[] = [];

  constructor() {
    try {
      const stored = localStorage.getItem(this.favoritesKey);
      this.favorites = stored ? JSON.parse(stored) : [];
    } catch {
      this.favorites = [];
    }
    try {
      const storedLast = localStorage.getItem(this.lastPlayedKey);
      this.lastPlayed = storedLast ? JSON.parse(storedLast) : [];
    } catch {
      this.lastPlayed = [];
    }
  }

  get favoriteGames(): GameTile[] {
    return this.allGames.filter(g => this.favorites.includes(g.title));
  }

  get gameRows(): GameRow[] {
    const continueGames: GameTile[] = this.lastPlayed
      .map(t => this.allGames.find(g => g.title === t))
      .filter((g): g is GameTile => !!g);

    return [
      {
        title: 'Continue playing',
        description: 'Jump back into the games you played recently.',
        games: continueGames,
      },
      {
        title: 'Favorite games',
        description: 'Your most played EduBet tables and quick rounds.',
        games: this.favoriteGames,
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

  isFavorite(game: GameTile) {
    return this.favorites.includes(game.title);
  }

  markLastPlayed(game: GameTile) {
    this.lastPlayed = [
      game.title,
      ...this.lastPlayed.filter(title => title !== game.title),
    ].slice(0, 5);

    try {
      localStorage.setItem(this.lastPlayedKey, JSON.stringify(this.lastPlayed));
    } catch {}
  }

  toggleFavorite(game: GameTile, event?: Event) {
    event?.stopPropagation();
    event?.preventDefault();

    const idx = this.favorites.indexOf(game.title);
    if (idx === -1) this.favorites.push(game.title);
    else this.favorites.splice(idx, 1);

    try {
      localStorage.setItem(this.favoritesKey, JSON.stringify(this.favorites));
    } catch {}
  }
}