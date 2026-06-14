import { db } from '../databases/db';
import {
  CreateGameHistoryDto,
  GameHistory,
  LeaderboardDetails,
  LeaderboardEntry
} from '../models/leaderboard-model';

export function createGameHistory(data: CreateGameHistoryDto): GameHistory | undefined {
  const user = db
    .prepare(`
      SELECT id
      FROM users
      WHERE id = ?
    `)
    .get(data.userId) as { id: number } | undefined;

  if (!user) {
    return undefined;
  }

  const coinsWon = data.result === 'win' ? data.coinsWon : 0;
  const coinsLost = data.result === 'loss' ? data.coinsLost : 0;

  const result = db
    .prepare(`
      INSERT INTO game_history (
        user_id,
        game_name,
        result,
        bet_amount,
        coins_won,
        coins_lost
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.userId,
      data.gameName,
      data.result,
      data.betAmount,
      coinsWon,
      coinsLost
    );

  return db
    .prepare(`
      SELECT *
      FROM game_history
      WHERE id = ?
    `)
    .get(Number(result.lastInsertRowid)) as GameHistory;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return db
    .prepare(`
      SELECT
        u.id,
        u.username,
        COUNT(g.id) AS games_played,
        COALESCE(SUM(CASE WHEN g.result = 'win' THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE WHEN g.result = 'loss' THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(SUM(g.coins_won), 0) AS coins_won,
        COALESCE(SUM(g.coins_lost), 0) AS coins_lost
      FROM users u
      LEFT JOIN game_history g ON g.user_id = u.id
      GROUP BY u.id, u.username
      ORDER BY wins DESC, coins_won DESC
    `)
    .all() as LeaderboardEntry[];
}

export function getLeaderboardUserDetails(userId: number): LeaderboardDetails | undefined {
  const stats = db
    .prepare(`
      SELECT
        u.id,
        u.username,
        COUNT(g.id) AS games_played,
        COALESCE(SUM(CASE WHEN g.result = 'win' THEN 1 ELSE 0 END), 0) AS wins,
        COALESCE(SUM(CASE WHEN g.result = 'loss' THEN 1 ELSE 0 END), 0) AS losses,
        COALESCE(SUM(g.coins_won), 0) AS coins_won,
        COALESCE(SUM(g.coins_lost), 0) AS coins_lost
      FROM users u
      LEFT JOIN game_history g ON g.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id, u.username
    `)
    .get(userId) as LeaderboardEntry | undefined;

  if (!stats) {
    return undefined;
  }

  const history = db
    .prepare(`
      SELECT *
      FROM game_history
      WHERE user_id = ?
      ORDER BY played_at DESC
    `)
    .all(userId) as GameHistory[];

  return {
    stats,
    history
  };
}