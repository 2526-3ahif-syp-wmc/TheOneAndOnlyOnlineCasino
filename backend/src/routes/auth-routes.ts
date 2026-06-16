import { Router } from 'express';
import { db } from '../databases/db';

export const authRouter = Router();

authRouter.get('/users', (_, res) => {
  const users = db
    .prepare(`
      SELECT id, username, coins, soundEnabled, musicEnabled, volume
      FROM users
    `)
    .all();

  return res.json(users.map(user => ({
    ...user,
    settings: {
      soundEnabled: Boolean(user.soundEnabled),
      musicEnabled: Boolean(user.musicEnabled),
      volume: user.volume
    }
  })));
});

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
      SELECT id, username, coins, soundEnabled, musicEnabled, volume
      FROM users
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

  return res.status(201).json({
    ...newUser,
    settings: {
      soundEnabled: Boolean(newUser.soundEnabled),
      musicEnabled: Boolean(newUser.musicEnabled),
      volume: newUser.volume
    }
  });
});

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(`
      SELECT id, username, coins, soundEnabled, musicEnabled, volume
      FROM users
      WHERE username = ? AND password = ?
    `)
    .get(username, password);

  if (!user) {
    return res.status(401).json({
      message: 'Invalid username or password'
    });
  }

  return res.json({
    ...user,
    settings: {
      soundEnabled: Boolean(user.soundEnabled),
      musicEnabled: Boolean(user.musicEnabled),
      volume: user.volume
    }
  });
});

authRouter.patch('/users/:userId/settings', (req, res) => {
  const { userId } = req.params;
  const { soundEnabled, musicEnabled, volume } = req.body;

  const result = db
    .prepare(`
      UPDATE users
      SET soundEnabled = ?, musicEnabled = ?, volume = ?
      WHERE id = ?
    `)
    .run(soundEnabled ? 1 : 0, musicEnabled ? 1 : 0, volume, userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  const updatedUser = db
    .prepare(`
      SELECT id, username, coins, soundEnabled, musicEnabled, volume
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json({
    ...updatedUser,
    settings: {
      soundEnabled: Boolean(updatedUser.soundEnabled),
      musicEnabled: Boolean(updatedUser.musicEnabled),
      volume: updatedUser.volume
    }
  });
});

authRouter.post('/users/:userId/change-password', (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  const user = db
    .prepare(`
      SELECT password
      FROM users
      WHERE id = ?
    `)
    .get(userId);

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

  db
    .prepare(`
      UPDATE users
      SET password = ?
      WHERE id = ?
    `)
    .run(newPassword, userId);

  return res.json({
    message: 'Password changed successfully'
  });
});

authRouter.patch('/users/:userId/username', (req, res) => {
  const { userId } = req.params;
  const { username } = req.body;

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

  const result = db
    .prepare(`
      UPDATE users
      SET username = ?
      WHERE id = ?
    `)
    .run(username, userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  const updatedUser = db
    .prepare(`
      SELECT id, username, coins, soundEnabled, musicEnabled, volume
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json({
    ...updatedUser,
    settings: {
      soundEnabled: Boolean(updatedUser.soundEnabled),
      musicEnabled: Boolean(updatedUser.musicEnabled),
      volume: updatedUser.volume
    }
  });
});