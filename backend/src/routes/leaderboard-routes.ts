import { Router } from 'express';
import { GameResult } from '../models/leaderboard-model';
import {
  createGameHistory,
  getLeaderboard,
  getLeaderboardUserDetails
} from '../services/leaderboard-service';

export const leaderboardRouter = Router();

leaderboardRouter.post('/game-history', (req, res) => {
  const userId = Number(req.body.userId);
  const gameName = String(req.body.gameName ?? '');
  const result = req.body.result as GameResult;
  const betAmount = Number(req.body.betAmount) || 0;
  const coinsWon = Number(req.body.coinsWon) || 0;
  const coinsLost = Number(req.body.coinsLost) || 0;

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      message: 'Valid userId is required'
    });
  }

  if (!gameName) {
    return res.status(400).json({
      message: 'gameName is required'
    });
  }

  if (result !== 'win' && result !== 'loss') {
    return res.status(400).json({
      message: 'Result must be win or loss'
    });
  }

  const historyEntry = createGameHistory({
    userId,
    gameName,
    result,
    betAmount,
    coinsWon,
    coinsLost
  });

  if (!historyEntry) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  return res.status(201).json(historyEntry);
});

leaderboardRouter.get('/', (_, res) => {
  const leaderboard = getLeaderboard().map((player, index) => ({
    rank: index + 1,
    ...player
  }));

  return res.json(leaderboard);
});

leaderboardRouter.get('/:id', (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      message: 'Invalid user id'
    });
  }

  const details = getLeaderboardUserDetails(userId);

  if (!details) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  return res.json(details);
});