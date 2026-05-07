import { Router } from 'express';
import { db } from '../databases/db';

export const authRouter = Router();

// REGISTER
authRouter.post('/users', (req, res) => {
   const { username, password, coins } = req.body;

    const existingUser = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ?
    `)
    .get(username);

  if (existingUser) {
    return res.status(409).json({
      message: 'Username already exists'
    });
  }

   const result = db
    .prepare(`
      INSERT INTO users (username, password, coins)
      VALUES (?, ?, ?)
    `)
    .run(username, password, coins ?? 1000);

  const newUser = db
    .prepare(`
      SELECT id, username, coins, premium
      FROM users
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

  return res.status(201).json(newUser);
});

// LOG IN
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(`
      SELECT id, username, coins, premium
      FROM users
      WHERE username = ? AND password = ?
    `)
    .get(username, password);

  if (!user) {
    return res.status(401).json({
      message: 'Invalid username or password'
    });
  }

  return res.json(user);
});

// UPDATE COINS
authRouter.patch('/users/:id/coins', (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  const result = db
    .prepare(`
      UPDATE users
      SET coins = ?
      WHERE id = ?
    `)
    .run(coins, userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  const updatedUser = db
    .prepare(`
      SELECT id, username, coins, premium
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json(updatedUser);
});

// UPDATE PROFILE
authRouter.patch('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const { username, currentPassword, newPassword } = req.body;

  type ProfileUserRow = {
    id: number;
    username: string;
    password: string;
    coins: number;
    premium: number;
  };

  const user = db
    .prepare(`
      SELECT id, username, password, coins, premium
      FROM users
      WHERE id = ?
    `)
    .get(userId) as ProfileUserRow | undefined;

  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  if (user.password !== currentPassword) {
    return res.status(401).json({
      message: 'Current password is incorrect'
    });
  }

  if (username !== user.username) {
    const existingUser = db
      .prepare(`
        SELECT id
        FROM users
        WHERE username = ? AND id != ?
      `)
      .get(username, userId);

    if (existingUser) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }
  }

  const passwordToSave = newPassword && newPassword.length > 0 ? newPassword : user.password;

  db.prepare(`
    UPDATE users
    SET username = ?, password = ?
    WHERE id = ?
  `).run(username, passwordToSave, userId);

  const updatedUser = db
    .prepare(`
      SELECT id, username, coins, premium
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json(updatedUser);
});

// PREMIUM
authRouter.patch('/users/:id/premium', (req, res) => {
  const id = Number(req.params.id);
  const { premium } = req.body;

  db.prepare(`
    UPDATE users
    SET premium = ?
    WHERE id = ?
  `).run(premium, id);

  const updatedUser = db.prepare(`
    SELECT id, username, coins, premium
    FROM users
    WHERE id = ?
  `).get(id);

  return res.json(updatedUser);
});

// LEADERBOARD
authRouter.get('/leaderboard', (req, res) => {
  const { type } = req.query;

  let orderBy = 'coins DESC'; // for wins, highest coins
  if (type === 'losses') {
    orderBy = 'coins ASC'; // for losses, lowest coins (most spent)
  }

  const users = db
    .prepare(`
      SELECT id, username, coins
      FROM users
      ORDER BY ${orderBy}
      LIMIT 10
    `)
    .all();

  return res.json(users);
});

// TOP PLAYERS
authRouter.get('/top-players', (_, res) => {
  const users = db
    .prepare(`
      SELECT id, username, coins
      FROM users
      ORDER BY coins DESC
      LIMIT 10
    `)
    .all();

  return res.json(users);
});