import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/user-service';
import { AlertService } from '../services/alert-service';

type TaskItem = {
  id: string;
  title: string;
  description: string;
  reward: number;
  xpReward: number;
  claimed: boolean;
  completed: boolean;
};

@Component({
  selector: 'app-daily-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-tasks.html',
  styleUrls: ['./daily-tasks.scss'],
})
export class DailyTasks {
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  protected tasks: TaskItem[] = [
    {
      id: 'login',
      title: 'Daily Login',
      description: 'Open the app and unlock today’s reward.',
      reward: 75,
      xpReward: 10,
      claimed: false,
      completed: false,
    },
    {
      id: 'play',
      title: 'Play a Game',
      description: 'Launch any game and play at least one round.',
      reward: 120,
      xpReward: 18,
      claimed: false,
      completed: false,
    },
    {
      id: 'visit-shop',
      title: 'Visit the Shop',
      description: 'Browse the store and check out new offers.',
      reward: 50,
      xpReward: 8,
      claimed: false,
      completed: false,
    },
  ];

  protected streak = 0;

  constructor() {
    this.loadState();
    this.completeDailyLogin();
  }

  protected get progressPercent() {
    const completedCount = this.tasks.filter((task) => task.claimed).length;
    return Math.round((completedCount / this.tasks.length) * 100);
  }

  protected get readyToClaimCount() {
    return this.tasks.filter((task) => task.completed && !task.claimed).length;
  }

  protected taskStatus(task: TaskItem): string {
    if (task.claimed) {
      return 'Claimed';
    }

    if (task.completed) {
      return 'Ready to claim';
    }

    return 'Incomplete';
  }

  protected async claimTask(task: TaskItem) {
    if (task.claimed) {
      this.alertService.info('Task already claimed');
      return;
    }

    if (!task.completed) {
      this.alertService.info('Complete the task before claiming it');
      return;
    }

    try {
      const coins = this.userService.coins() + task.reward;
      const xp = this.userService.xp() + task.xpReward;

      await firstValueFrom(this.userService.updateCoins(coins));
      await firstValueFrom(this.userService.updateXp(xp));

      task.claimed = true;
      this.saveState();
      this.updateStreakIfNeeded();
      this.alertService.success(`+${task.reward} EC · +${task.xpReward} XP`);
    } catch (err) {
      console.error(err);
      this.alertService.error('Claim failed');
    }
  }

  protected async claimAll() {
    const ready = this.tasks.filter((task) => task.completed && !task.claimed);

    if (ready.length === 0) {
      this.alertService.info('No rewards ready to claim');
      return;
    }

    const totalCoins = ready.reduce((sum, task) => sum + task.reward, 0);
    const totalXp = ready.reduce((sum, task) => sum + task.xpReward, 0);

    try {
      await firstValueFrom(this.userService.updateCoins(this.userService.coins() + totalCoins));
      await firstValueFrom(this.userService.updateXp(this.userService.xp() + totalXp));

      ready.forEach((task) => (task.claimed = true));
      this.saveState();
      this.updateStreakIfNeeded();
      this.alertService.success(`+${totalCoins} EC · +${totalXp} XP`);
    } catch (err) {
      console.error(err);
      this.alertService.error('Claim all failed');
    }
  }

  private todayKey(): string {
    const user = this.userService.currentUser();
    const uid = user?.id ?? 'anon';
    const day = new Date().toISOString().slice(0, 10);
    return `daily-tasks-state-${uid}-${day}`;
  }

  private streakKey(): string {
    const user = this.userService.currentUser();
    const uid = user?.id ?? 'anon';
    return `daily-tasks-streak-${uid}`;
  }

  private loadState(): void {
    this.loadStreak();

    try {
      const raw = localStorage.getItem(this.todayKey());
      if (!raw) {
        return;
      }

      const obj = JSON.parse(raw) as Record<
        string,
        { claimed: boolean; completed: boolean }
      >;

      this.tasks.forEach((task) => {
        const saved = obj[task.id];
        if (saved) {
          task.claimed = !!saved.claimed;
          task.completed = !!saved.completed;
        }
      });
    } catch {
      // ignore invalid saved state
    }
  }

  private saveState(): void {
    const obj: Record<string, { claimed: boolean; completed: boolean }> = {};
    this.tasks.forEach((task) => {
      obj[task.id] = {
        claimed: task.claimed,
        completed: task.completed,
      };
    });

    localStorage.setItem(this.todayKey(), JSON.stringify(obj));
  }

  private loadStreak(): void {
    try {
      const raw = localStorage.getItem(this.streakKey());
      if (!raw) {
        this.streak = 0;
        return;
      }

      const saved = JSON.parse(raw) as { day: string; streak: number };
      this.streak = saved.streak ?? 0;
    } catch {
      this.streak = 0;
    }
  }

  private saveStreak(day: string, streak: number): void {
    localStorage.setItem(this.streakKey(), JSON.stringify({ day, streak }));
    this.streak = streak;
  }

  private completeDailyLogin(): void {
    this.completeTask('login');
  }

  private completeTask(taskId: string): void {
    const task = this.tasks.find((entry) => entry.id === taskId);
    if (!task || task.completed) {
      return;
    }

    task.completed = true;
    this.saveState();
  }

  private updateStreakIfNeeded(): void {
    if (!this.tasks.every((task) => task.claimed)) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.streakKey());
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      let currentStreak = 1;
      let prevDay = '';

      if (raw) {
        const saved = JSON.parse(raw) as { day: string; streak: number };
        prevDay = saved.day ?? '';
        currentStreak = prevDay === yesterday ? (saved.streak ?? 0) + 1 : 1;
      }

      this.saveStreak(new Date().toISOString().slice(0, 10), currentStreak);
    } catch {
      this.saveStreak(new Date().toISOString().slice(0, 10), 1);
    }
  }
}

