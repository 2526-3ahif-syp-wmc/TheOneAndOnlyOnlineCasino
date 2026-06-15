import { db } from "../databases/db";
import { ProfileUserRow, User } from "../models/user-model";

export type PublicUser = {
  id: number;
  username: string;
  coins: number;
  premium: number;
  wins: number;
  losses: number;
  xp: number;
};

function toPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    coins: row.coins,
    premium: row.premium,
    wins: row.wins,
    losses: row.losses,
    xp: row.xp,
  };
}

type PublicUserRow = {
  id: number;
  username: string;
  coins: number;
  premium: number;
  wins: number;
  losses: number;
  xp: number;
};

export function getPublicUserById(id: number): User | undefined {
  return db
    .prepare(
      `
      SELECT id, username, coins, premium, wins, losses, xp
      FROM users
      WHERE id = ?
    `,
    )
    .get(id) as User | undefined;
}

export function getPublicUsers(excludeUserId?: number): PublicUser[] {
  const query = `
    SELECT id, username, coins, premium, wins, losses, xp
    FROM users
    ${Number.isInteger(excludeUserId) ? "WHERE id != ?" : ""}
    ORDER BY username COLLATE NOCASE ASC
  `;

  const rows = Number.isInteger(excludeUserId)
    ? (db.prepare(query).all(excludeUserId) as PublicUserRow[])
    : (db.prepare(query).all() as PublicUserRow[]);

  return rows.map(toPublicUser);
}

export function searchPublicUsers(queryText: string, excludeUserId?: number): PublicUser[] {
  const searchText = `%${queryText.trim()}%`;
  const query = `
    SELECT id, username, coins, premium, wins, losses, xp
    FROM users
    WHERE username LIKE ? COLLATE NOCASE
    ${Number.isInteger(excludeUserId) ? "AND id != ?" : ""}
    ORDER BY username COLLATE NOCASE ASC
  `;

  const rows = Number.isInteger(excludeUserId)
    ? (db.prepare(query).all(searchText, excludeUserId) as PublicUserRow[])
    : (db.prepare(query).all(searchText) as PublicUserRow[]);

  return rows.map(toPublicUser);
}

export function usernameExists(username: string): boolean {
  const user = db
    .prepare(
      `
      SELECT id
      FROM users
      WHERE username = ?  
    `,
    )
    .get(username);

  return !!user;
}

export function usernameExistsForOtherUser(
  username: string,
  userId: number,
): boolean {
  const user = db
    .prepare(
      `
      SELECT id
      FROM users
      WHERE username = ? AND id != ?
    `,
    )
    .get(username, userId);

  return !!user;
}

export function createUser(
  username: string,
  password: string,
  coins: number = 1000,
): User | undefined {
  const result = db
    .prepare(
      `
      INSERT INTO users (username, password, coins)
      VALUES (?, ?, ?)
    `,
    )
    .run(username, password, coins);

  return getPublicUserById(Number(result.lastInsertRowid));
}

export function findUserByLogin(
  username: string,
  password: string,
): User | undefined {
  return db
    .prepare(
      `
      SELECT id, username, coins, premium, wins, losses, xp
      FROM users
      WHERE username = ? AND password = ?
    `,
    )
    .get(username, password) as User | undefined;
}

export function getProfileUserById(id: number): ProfileUserRow | undefined {
  return db
    .prepare(
      `
      SELECT id, username, password, coins, premium, wins, losses, xp
      FROM users
      WHERE id = ?
    `,
    )
    .get(id) as ProfileUserRow | undefined;
}

export function updateCoins(userId: number, coins: number): User | undefined {
  const result = db
    .prepare(
      `
      UPDATE users
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(coins, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function updateXp(userId: number, xp: number): User | undefined {
  const result = db
    .prepare(
      `
      UPDATE users
      SET xp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(xp, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function updatePremium(
  userId: number,
  premium: number,
): User | undefined {
  const result = db
    .prepare(
      `
      UPDATE users
      SET premium = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(premium, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}

export function updateProfile(
  userId: number,
  username: string,
  password: string,
): User | undefined {
  const result = db
    .prepare(
      `
      UPDATE users
      SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(username, password, userId);

  if (result.changes === 0) {
    return undefined;
  }

  return getPublicUserById(userId);
}
