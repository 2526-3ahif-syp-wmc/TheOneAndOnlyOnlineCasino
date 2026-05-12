import { db } from '../databases/db';
import { ProfileUserRow, User } from '../models/user-model';

export function getPublicUserById(id: number): User | undefined {
  return db
    .prepare(`
      SELECT id, username, coins, premium, wins, losses, xp
      FROM users
      WHERE id = ?
    `)
    .get(id) as User | undefined;
}

export function usernameExists(username: string): boolean {
  const user = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ?
    `)
    .get(username);

  return !!user;
}

export function usernameExistsForOtherUser(username: string, userId: number): boolean {
  const user = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ? AND id != ?
    `)
    .get(username, userId);

  return !!user;
}

export function createUser(username: string, password: string, coins: number = 1000): User | undefined {
  const result = db
    .prepare(`
      INSERT INTO users (username, password, coins)
      VALUES (?, ?, ?)
    `)
    .run(username, password, coins);

  return getPublicUserById(Number(result.lastInsertRowid));
}

export function findUserByLogin(username: string, password: string): User | undefined {
  return db
    .prepare(`
      SELECT id, username, coins, premium, wins, losses, xp
      FROM users
      WHERE username = ? AND password = ?
    `)
    .get(username, password) as User | undefined;
}

export function getProfileUserById(id: number): ProfileUserRow | undefined {
  return db
    .prepare(`
      SELECT id, username, password, coins, premium, wins, losses, xp
      FROM users
      WHERE id = ?
    `)
    .get(id) as ProfileUserRow | undefined;
}

export function createGameTransaction(userId: number, amount: number, type: 'win' | 'loss'): void {
  db.prepare(`
      INSERT INTO game_transactions (user_id, amount, type)
      VALUES (?, ?, ?)
    `)
    .run(userId, amount, type);
}

export function updateCoins(
  userId: number,
  coins: number,
  transactionType?: 'win' | 'loss',
  transactionAmount?: number
): User | undefined {
  const result = db
    .prepare(`
      UPDATE users
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(coins, userId);

  if (result.changes === 0) {
    return undefined;
  }

  if (transactionType && transactionAmount && transactionAmount > 0) {
    createGameTransaction(userId, transactionAmount, transactionType);
  }

  return getPublicUserById(userId);
}

export function updateXp(userId: number, xp: number): User | undefined {
  const result = db
    .prepare(`
      UPDATE users
      SET xp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(xp, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function updatePremium(userId: number, premium: number): User | undefined {
  const result = db
    .prepare(`
      UPDATE users
      SET premium = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(premium, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function updateProfile(
  userId: number,
  username: string,
  password: string
): User | undefined {
  const result = db
    .prepare(`
      UPDATE users
      SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(username, password, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function getLeaderboard(type: unknown, period: unknown = 'all'): User[] {
  const leaderboardType = type === 'losses' ? 'loss' : 'win';
  let periodFilter = '';

  switch (period) {
    case 'today':
      periodFilter = "AND gt.created_at >= date('now','localtime','start of day')";
      break;
    case 'last-week':
      periodFilter = "AND gt.created_at >= date('now','localtime','-6 days')";
      break;
    case 'last-month':
      periodFilter = "AND gt.created_at >= datetime('now','localtime','-30 days')";
      break;
    case 'all':
    default:
      periodFilter = '';
      break;
  }

  return db
    .prepare(`
      SELECT u.id, u.username, SUM(gt.amount) AS coins, u.premium, u.wins, u.losses, u.xp
      FROM game_transactions gt
      JOIN users u ON u.id = gt.user_id
      WHERE gt.type = ? ${periodFilter}
      GROUP BY u.id
      ORDER BY coins DESC
      LIMIT 10
    `)
    .all([leaderboardType]) as User[];
}

export function getTopPlayers(): User[] {
  return db
    .prepare(`
      SELECT id, username, coins, premium, wins, losses, xp
      FROM users
      ORDER BY xp DESC
      LIMIT 10
    `)
    .all() as User[];
}