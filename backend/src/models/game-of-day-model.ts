export interface DailyGameOfDay {
  id: number;
  selected_at: string;
  game_name: string;
  bonus_percent: number;
}

export const GAME_OF_DAY_OPTIONS = ['Mines', 'Slot Machine', 'Roulette'] as const;

export type GameOfDayOption = (typeof GAME_OF_DAY_OPTIONS)[number];
