export type GameResult = 'win' | 'loss';

export interface GameHistory {
  id: number;
  user_id: number;
  game_name: string;
  result: GameResult;
  bet_amount: number;
  coins_won: number;
  coins_lost: number;
  played_at: string;
}

export interface CreateGameHistoryDto {
  userId: number;
  gameName: string;
  result: GameResult;
  betAmount: number;
  coinsWon: number;
  coinsLost: number;
}

export interface LeaderboardEntry {
  rank?: number;
  id: number;
  username: string;
  games_played: number;
  wins: number;
  losses: number;
  coins_won: number;
  coins_lost: number;
}

export interface LeaderboardDetails {
  stats: LeaderboardEntry;
  history: GameHistory[];
}