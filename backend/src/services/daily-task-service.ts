import { db } from '../databases/db';
import { User, getPublicUserById } from './user-service';
import { DailyTask } from '../models/daily-task-model';

type DailyTaskConfig = {
  task_key: string;
  description: string;
  target: number;
  reward_coins: number;
  reward_xp: number;
};

const DAILY_TASKS_CONFIG: DailyTaskConfig[] = [
  {
    task_key: 'play_slot_spins',
    description: 'Play 5 spins on the slot machine',
    target: 5,
    reward_coins: 200,
    reward_xp: 20,
  },
  {
    task_key: 'daily_login',
    description: 'Log in daily',
    target: 1,
    reward_coins: 150,
    reward_xp: 15,
  },
  {
    task_key: 'win_game',
    description: 'Win a game',
    target: 1,
    reward_coins: 300,
    reward_xp: 30,
  },
];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyTasksForDate(userId: number, taskDate: string): DailyTask[] {
  return db
    .prepare(`
      SELECT *
      FROM daily_tasks
      WHERE user_id = ? AND task_date = ?
      ORDER BY id
    `)
    .all(userId, taskDate) as DailyTask[];
}

function getDailyTaskByKey(userId: number, taskKey: string, taskDate: string): DailyTask | undefined {
  return db
    .prepare(`
      SELECT *
      FROM daily_tasks
      WHERE user_id = ? AND task_key = ? AND task_date = ?
    `)
    .get(userId, taskKey, taskDate) as DailyTask | undefined;
}

function getDailyTaskById(taskId: number): DailyTask | undefined {
  return db
    .prepare(`
      SELECT *
      FROM daily_tasks
      WHERE id = ?
    `)
    .get(taskId) as DailyTask | undefined;
}

function createDailyTasksForDate(userId: number, taskDate: string): void {
  const insertTask = db.prepare(`
    INSERT INTO daily_tasks (
      user_id,
      task_key,
      description,
      progress,
      target,
      reward_coins,
      reward_xp,
      completed,
      claimed,
      task_date
    ) VALUES (?, ?, ?, 0, ?, ?, ?, 0, 0, ?)
  `);

  const create = db.transaction((tasks: DailyTaskConfig[]) => {
    for (const task of tasks) {
      insertTask.run(
        userId,
        task.task_key,
        task.description,
        task.target,
        task.reward_coins,
        task.reward_xp,
        taskDate
      );
    }
  });

  create(DAILY_TASKS_CONFIG);
}

export function getDailyTasksForUser(userId: number): DailyTask[] | undefined {
  const user = getPublicUserById(userId);

  if (!user) {
    return undefined;
  }

  const taskDate = todayDate();
  const tasks = getDailyTasksForDate(userId, taskDate);

  if (tasks.length > 0) {
    return tasks;
  }

  createDailyTasksForDate(userId, taskDate);
  return getDailyTasksForDate(userId, taskDate);
}

export function updateDailyTaskProgress(userId: number, taskKey: string, amount: number): DailyTask | undefined {
  const user = getPublicUserById(userId);

  if (!user) {
    return undefined;
  }

  const taskDate = todayDate();
  const task = getDailyTaskByKey(userId, taskKey, taskDate) ?? (() => {
    createDailyTasksForDate(userId, taskDate);
    return getDailyTaskByKey(userId, taskKey, taskDate);
  })();

  if (!task) {
    return undefined;
  }

  if (task.completed === 1 || task.claimed === 1) {
    return task;
  }

  const nextProgress = Math.min(task.target, task.progress + Math.max(0, amount));
  const completed = nextProgress >= task.target ? 1 : 0;

  db.prepare(`
    UPDATE daily_tasks
    SET progress = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextProgress, completed, task.id);

  return getDailyTaskById(task.id);
}

export function claimDailyTaskReward(userId: number, taskId: number): { task: DailyTask; user: User } | undefined {
  const user = getPublicUserById(userId);

  if (!user) {
    return undefined;
  }

  const task = getDailyTaskById(taskId);

  if (!task || task.user_id !== userId || task.completed !== 1 || task.claimed === 1) {
    return undefined;
  }

  const newCoins = user.coins + task.reward_coins;
  const newXp = user.xp + task.reward_xp;

  const claimTransaction = db.transaction(() => {
    db.prepare(`
      UPDATE users
      SET coins = ?, xp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newCoins, newXp, userId);

    db.prepare(`
      UPDATE daily_tasks
      SET claimed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(taskId);
  });

  claimTransaction();

  const updatedTask = getDailyTaskById(taskId);
  const updatedUser = getPublicUserById(userId);

  if (!updatedTask || !updatedUser) {
    return undefined;
  }

  return {
    task: updatedTask,
    user: updatedUser,
  };
}
