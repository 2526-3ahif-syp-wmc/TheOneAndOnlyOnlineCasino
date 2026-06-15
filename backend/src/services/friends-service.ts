import { db } from '../databases/db';
import { Friend, FriendRow } from '../models/friends-model';
import { findPublicUserByUsername, getPublicUserById } from './user-service';

function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

function mapFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    username: row.friend_name,
    level: row.level,
    totalWins: row.total_wins,
    balance: row.balance,
    lastActive: row.last_active
  };
}

export function getFriendsByUserId(userId: number): Friend[] {
  const rows = db
    .prepare(
      `
      SELECT id, user_id, friend_name, status, level, total_wins, balance, last_active, created_at, updated_at
      FROM friends
      WHERE user_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
    `
    )
    .all(userId) as FriendRow[];

  return rows.map(mapFriend);
}

export function addFriend(
  userId: number,
  friendName: string
): Friend | undefined {
  const normalizedFriendName = friendName.trim();
  const matchedUser = findPublicUserByUsername(normalizedFriendName);

  if (!matchedUser) {
    return undefined;
  }

  const currentUser = getPublicUserById(userId);

  if (!currentUser || currentUser.username.toLowerCase() === matchedUser.username.toLowerCase()) {
    return undefined;
  }

  const existingFriend = db
    .prepare(
      `
      SELECT id
      FROM friends
      WHERE user_id = ? AND lower(friend_name) = lower(?)
    `
    )
    .get(userId, matchedUser.username);

  if (existingFriend) {
    return undefined;
  }

  const level = getLevelFromXp(matchedUser.xp);
  const totalWins = matchedUser.wins;
  const balance = matchedUser.coins;

  const result = db
    .prepare(
      `
      INSERT INTO friends (user_id, friend_name, level, total_wins, balance, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(userId, matchedUser.username, level, totalWins, balance, 'just added');

  const inserted = db
    .prepare(
      `
      SELECT id, user_id, friend_name, status, level, total_wins, balance, last_active, created_at, updated_at
      FROM friends
      WHERE id = ?
    `
    )
    .get(Number(result.lastInsertRowid)) as FriendRow | undefined;

  return inserted ? mapFriend(inserted) : undefined;
}

export function removeFriend(userId: number, friendId: number): boolean {
  const result = db
    .prepare(
      `
      DELETE FROM friends
      WHERE id = ? AND user_id = ?
    `
    )
    .run(friendId, userId);

  return result.changes > 0;
}
