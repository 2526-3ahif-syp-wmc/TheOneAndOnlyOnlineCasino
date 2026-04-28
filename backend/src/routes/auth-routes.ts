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