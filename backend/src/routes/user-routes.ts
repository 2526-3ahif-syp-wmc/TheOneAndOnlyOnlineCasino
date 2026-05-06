import { Router } from 'express';
import { db } from '../databases/db';

export const authRouter = Router();

authRouter.get('/users', (_, res) => {
  const users = db
    .prepare(`
      SELECT id, username, coins
      FROM users
    `)
    .all();

  return res.json(users);
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
      SELECT id, username, coins
      FROM users
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

  return res.status(201).json(newUser);
});

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(`
      SELECT id, username, coins
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
      SELECT id, username, coins
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json(updatedUser);
});

authRouter.patch('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const { username, currentPassword, newPassword, edubet } = req.body;

  const existing = db
    .prepare(`
      SELECT id, username, password, coins
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  if (!existing) {
    return res.status(404).json({ message: 'User not found' });
  }

  // If a password change or validation is requested, verify current password
  if (currentPassword) {
    if (existing.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
  }

  // If username is changing, ensure uniqueness
  if (username && username !== existing.username) {
    const conflict = db
      .prepare(`
        SELECT id
        FROM users
        WHERE username = ? AND id != ?
      `)
      .get(username, userId);

    if (conflict) {
      return res.status(409).json({ message: 'Username already exists' });
    }
  }

  // If edubet flag is provided, ensure column exists (add if missing)
  let hasEduColumn = db
    .prepare("PRAGMA table_info(users)")
    .all()
    .some((c: any) => c.name === 'edubet');

  if (edubet !== undefined && !hasEduColumn) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN edubet INTEGER NOT NULL DEFAULT 1`);
      hasEduColumn = true;
    } catch (e) {
      // ignore - column may have been added concurrently
    }
  }

  const updates: Array<string> = [];
  const params: Array<any> = [];

  if (username && username !== existing.username) {
    updates.push('username = ?');
    params.push(username);
  }

  if (newPassword) {
    updates.push('password = ?');
    params.push(newPassword);
  }

  if (edubet !== undefined) {
    updates.push('edubet = ?');
    params.push(edubet ? 1 : 0);
  }

  if (updates.length === 0) {
    // Nothing to update; return current user info (include edubet if present)
    if (hasEduColumn) {
      const user = db
        .prepare(`
          SELECT id, username, coins, edubet
          FROM users
          WHERE id = ?
        `)
        .get(userId);

      return res.json(user);
    }

    const user = db
      .prepare(`
        SELECT id, username, coins
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    return res.json(user);
  }

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  params.push(userId);

  const result = db.prepare(sql).run(...params);

  if (result.changes === 0) {
    return res.status(500).json({ message: 'Failed to update user' });
  }

  if (hasEduColumn) {
    const updatedUser = db
      .prepare(`
        SELECT id, username, coins, edubet
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    return res.json(updatedUser);
  }

  const updatedUser = db
    .prepare(`
      SELECT id, username, coins
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json(updatedUser);
});