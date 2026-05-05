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