export type DailyTask = {
  id: number;
  user_id: number;
  task_key: string;
  description: string;
  progress: number;
  target: number;
  reward_coins: number;
  reward_xp: number;
  completed: number;
  claimed: number;
  task_date: string;
  created_at: string;
  updated_at: string;
};
