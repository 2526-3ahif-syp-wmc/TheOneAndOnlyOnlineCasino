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