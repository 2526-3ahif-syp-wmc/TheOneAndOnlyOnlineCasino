import { db } from '../databases/db';
import { Friend, FriendRow } from '../models/friends-model';
import { getPublicUserById } from './user-service';

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

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  status: string;
}

export function getFriendsByUserId(userId: number): Friend[] {
  const rows = db
    .prepare(
      `
      SELECT
        f.id,
        f.user_id,
        f.friend_name,
        f.status,
        COALESCE(u.xp, f.level) as xp,
        COALESCE(u.wins, f.total_wins) as total_wins,
        COALESCE(u.coins, f.balance) as balance,
        f.last_active,
        f.created_at,
        f.updated_at
      FROM friends f
      LEFT JOIN users u ON lower(u.username) = lower(f.friend_name)
      WHERE f.user_id = ?
      ORDER BY datetime(f.updated_at) DESC, f.id DESC
    `
    )
    .all(userId) as any[];

  return rows.map(row => {
    return {
      id: row.id,
      username: row.friend_name,
      level: getLevelFromXp(row.xp),
      totalWins: row.total_wins,
      balance: row.balance,
      lastActive: row.last_active
    };
  });
}

export function sendFriendRequest(senderId: number, receiverUsername: string) {
  const sender = getPublicUserById(senderId);

  if (!sender) {
    throw new Error('Sender not found');
  }

  const receiver = db.prepare(`
    SELECT id, username
    FROM users
    WHERE lower(username) = lower(?)
  `).get(receiverUsername) as { id: number; username: string } | undefined;

  if (!receiver) {
    throw new Error('User not found');
  }

  if (receiver.id === senderId) {
    throw new Error('You cannot add yourself');
  }

  const alreadyFriends = db.prepare(`
    SELECT id
    FROM friends
    WHERE user_id = ? AND lower(friend_name) = lower(?)
  `).get(senderId, receiver.username);

  if (alreadyFriends) {
    throw new Error('Already friends');
  }

  const existingPending = db.prepare(`
    SELECT id
    FROM friend_requests
    WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `).get(senderId, receiver.id);

  if (existingPending) {
    throw new Error('Request already sent');
  }

  const reversePending = db.prepare(`
    SELECT id
    FROM friend_requests
    WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `).get(receiver.id, senderId);

  if (reversePending) {
    throw new Error('This user already sent you a request');
  }

  db.prepare(`
    INSERT INTO friend_requests (sender_id, receiver_id, status)
    VALUES (?, ?, 'pending')
  `).run(senderId, receiver.id);

  return { success: true };
}

export function getFriendRequests(userId: number): FriendRequest[] {
  return db.prepare(`
    SELECT 
      fr.id,
      fr.sender_id as senderId,
      fr.receiver_id as receiverId,
      u.username as senderUsername,
      fr.status
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
    ORDER BY fr.id DESC
  `).all(userId) as FriendRequest[];
}

export function acceptFriendRequest(requestId: number) {
  const request = db.prepare(`
    SELECT 
      fr.id,
      fr.sender_id as senderId,
      fr.receiver_id as receiverId,
      sender.username as senderUsername,
      sender.xp as senderXp,
      sender.wins as senderWins,
      sender.coins as senderCoins,
      receiver.username as receiverUsername,
      receiver.xp as receiverXp,
      receiver.wins as receiverWins,
      receiver.coins as receiverCoins
    FROM friend_requests fr
    JOIN users sender ON fr.sender_id = sender.id
    JOIN users receiver ON fr.receiver_id = receiver.id
    WHERE fr.id = ? AND fr.status = 'pending'
  `).get(requestId) as any;

  if (!request) {
    throw new Error('Request not found');
  }

  const existingForReceiver = db.prepare(`
    SELECT id FROM friends
    WHERE user_id = ? AND lower(friend_name) = lower(?)
  `).get(request.receiverId, request.senderUsername);

  if (!existingForReceiver) {
    db.prepare(`
      INSERT INTO friends (user_id, friend_name, level, total_wins, balance, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      request.receiverId,
      request.senderUsername,
      getLevelFromXp(request.senderXp),
      request.senderWins,
      request.senderCoins,
      'just added'
    );
  }

  const existingForSender = db.prepare(`
    SELECT id FROM friends
    WHERE user_id = ? AND lower(friend_name) = lower(?)
  `).get(request.senderId, request.receiverUsername);

  if (!existingForSender) {
    db.prepare(`
      INSERT INTO friends (user_id, friend_name, level, total_wins, balance, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      request.senderId,
      request.receiverUsername,
      getLevelFromXp(request.receiverXp),
      request.receiverWins,
      request.receiverCoins,
      'just added'
    );
  }

  db.prepare(`
    UPDATE friend_requests
    SET status = 'accepted'
    WHERE id = ?
  `).run(requestId);

  db.prepare(`
    INSERT INTO notifications (user_id, message)
    VALUES (?, ?)
  `).run(
    request.senderId,
    `${request.receiverUsername} accepted your friend request`
  );

  return { success: true };
}

export function declineFriendRequest(requestId: number) {
  const request = db.prepare(`
    SELECT
      fr.sender_id as senderId,
      sender.username as senderUsername,
      receiver.username as receiverUsername
    FROM friend_requests fr
    JOIN users sender ON sender.id = fr.sender_id
    JOIN users receiver ON receiver.id = fr.receiver_id
    WHERE fr.id = ? AND fr.status = 'pending'
  `).get(requestId) as any;

  if (!request) {
    throw new Error('Request not found');
  }

  db.prepare(`
    UPDATE friend_requests
    SET status = 'declined'
    WHERE id = ?
  `).run(requestId);

  db.prepare(`
    INSERT INTO notifications (user_id, message)
    VALUES (?, ?)
  `).run(
    request.senderId,
    `${request.receiverUsername} declined your friend request`
  );

  return { success: true };
}

export function removeFriend(userId: number, friendId: number): boolean {
  const friend = db.prepare(`
    SELECT friend_name
    FROM friends
    WHERE id = ? AND user_id = ?
  `).get(friendId, userId) as { friend_name: string } | undefined;

  if (!friend) {
    return false;
  }

  const currentUser = getPublicUserById(userId);

  const result = db
    .prepare(
      `
      DELETE FROM friends
      WHERE id = ? AND user_id = ?
    `
    )
    .run(friendId, userId);

  if (currentUser) {
    const otherUser = db.prepare(`
      SELECT id
      FROM users
      WHERE lower(username) = lower(?)
    `).get(friend.friend_name) as { id: number } | undefined;

    if (otherUser) {
      db.prepare(`
        DELETE FROM friends
        WHERE user_id = ? AND lower(friend_name) = lower(?)
      `).run(otherUser.id, currentUser.username);
    }
  }

  return result.changes > 0;
}