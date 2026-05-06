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
      SELECT id, username, coins, premium, wins, losses
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

authRouter.patch('/users/:id/coins', (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  const result = db
    .prepare(`
      UPDATE users
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
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

// PREMIUM
authRouter.patch('/users/:id/premium', (req, res) => {
  const id = Number(req.params.id);
  const { premium } = req.body;

  db.prepare(`
    UPDATE users
    SET premium = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(premium, id);

  const updatedUser = db.prepare(`
    SELECT id, username, coins, premium, wins, losses
    FROM users
    WHERE id = ?
  `).get(id);

  return res.json(updatedUser);
});

// LEADERBOARD - GET BY TYPE AND PERIOD
authRouter.get('/leaderboard/:type', (req, res) => {
  const { type } = req.params;
  const { period } = req.query;

  if (type !== 'wins' && type !== 'losses') {
    return res.status(400).json({
      message: 'Invalid type. Must be "wins" or "losses"'
    });
  }

  // Determine the date filter based on period
  let dateFilter = '1=1'; // default: all time
  if (period === 'today') {
    dateFilter = `DATE(gh.created_at) = DATE('now')`;
  } else if (period === 'last-week') {
    dateFilter = `DATE(gh.created_at) >= DATE('now', '-7 days')`;
  } else if (period === 'last-month') {
    dateFilter = `DATE(gh.created_at) >= DATE('now', '-30 days')`;
  }

  let orderBy = 'total DESC'; // for wins, highest count
  let resultFilter = "'win'"; // default to wins
  
  if (type === 'losses') {
    orderBy = 'total DESC'; // for losses, we still want most losses at top
    resultFilter = "'loss'";
  }

  const query = `
    SELECT 
      u.id,
      u.username,
      COALESCE(COUNT(gh.id), 0) as coins
    FROM users u
    LEFT JOIN game_history gh ON u.id = gh.user_id AND gh.result = ${resultFilter} AND ${dateFilter}
    GROUP BY u.id, u.username
    ORDER BY ${orderBy}
    LIMIT 10
  `;

  const users = db.prepare(query).all();

  return res.json(users);
});

// TOP PLAYERS
authRouter.get('/leaderboard/top-players', (req, res) => {
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