import { Router } from 'express';
import { fetchOrCreateDailyGameOfDay } from '../services/game-of-day-service';

export const gameOfDayRouter = Router();

gameOfDayRouter.get('/', (_, res) => {
  const dailyGame = fetchOrCreateDailyGameOfDay();

  return res.json({
    gameName: dailyGame.game_name,
    bonusPercent: dailyGame.bonus_percent,
    selectedAt: dailyGame.selected_at,
  });
});
