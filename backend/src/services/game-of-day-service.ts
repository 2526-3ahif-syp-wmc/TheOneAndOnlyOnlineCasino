import { db } from '../databases/db';
import { DailyGameOfDay, GAME_OF_DAY_OPTIONS, GameOfDayOption } from '../models/game-of-day-model';

const BONUS_PERCENT = 10;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickGameOfTheDay(dateString: string): GameOfDayOption {
  let hash = 0;

  for (const char of dateString) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return GAME_OF_DAY_OPTIONS[hash % GAME_OF_DAY_OPTIONS.length];
}

export function getDailyGameOfDayForDate(date: string): DailyGameOfDay | undefined {
  return db
    .prepare(`
      SELECT id, selected_at, game_name, bonus_percent
      FROM daily_game_of_day
      WHERE selected_at = ?
    `)
    .get(date) as DailyGameOfDay | undefined;
}

export function createDailyGameOfDay(date: string): DailyGameOfDay {
  const gameName = pickGameOfTheDay(date);

  const result = db
    .prepare(`
      INSERT INTO daily_game_of_day (selected_at, game_name, bonus_percent)
      VALUES (?, ?, ?)
    `)
    .run(date, gameName, BONUS_PERCENT);

  return {
    id: Number(result.lastInsertRowid),
    selected_at: date,
    game_name: gameName,
    bonus_percent: BONUS_PERCENT,
  };
}

export function fetchOrCreateDailyGameOfDay(): DailyGameOfDay {
  const today = getTodayDate();
  const existing = getDailyGameOfDayForDate(today);

  if (existing) {
    return existing;
  }

  return createDailyGameOfDay(today);
}
