import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../services/alert-service';
import { UserService } from '../services/user-service';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
}

@Component({
  selector: 'app-daily-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './daily-tasks.html',
  styleUrls: ['./daily-tasks.scss'],
})
export class DailyTasks {
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  protected username = this.userService.username;
  protected coins = this.userService.coins;
  protected xp = this.userService.xp;

  private today = new Date().toISOString().slice(0, 10);
  private storageKey = computed(() => `daily-tasks-completed-${this.username()}-${this.today}`);

  protected completedTaskIds = signal<string[]>(this.loadCompletedTaskIds());

  protected tasks: DailyTask[] = [
    {
      id: 'daily-check-in',
      title: 'Daily check-in',
      description: 'Claim your daily login reward to keep your streak alive.',
      rewardCoins: 300,
      rewardXp: 15,
    },
    {
      id: 'task-board',
      title: 'Task board',
      description: 'Complete this task to earn extra coins and XP.',
      rewardCoins: 250,
      rewardXp: 10,
    },
    {
      id: 'shop-visit',
      title: 'Shop visit',
      description: 'Open the shop to stay ready for your next big win.',
      rewardCoins: 200,
      rewardXp: 10,
    },
  ];

  protected completedCount = computed(() => this.completedTaskIds().length);
  protected allCompleted = computed(() => this.completedCount() === this.tasks.length);
  protected loadingTaskId = signal<string | null>(null);

  protected isCompleted(taskId: string) {
    return this.completedTaskIds().includes(taskId);
  }

  protected isLoading(taskId: string) {
    return this.loadingTaskId() === taskId;
  }

  protected async completeTask(task: DailyTask) {
    if (this.isCompleted(task.id) || this.isLoading(task.id)) {
      return;
    }

    const newCoins = this.coins() + task.rewardCoins;
    const newXp = this.xp() + task.rewardXp;

    this.loadingTaskId.set(task.id);

    try {
      await firstValueFrom(this.userService.updateCoins(newCoins));
      await firstValueFrom(this.userService.updateXp(newXp));

      this.completedTaskIds.update((ids) => [...ids, task.id]);
      localStorage.setItem(this.storageKey(), JSON.stringify(this.completedTaskIds()));
      this.alertService.success(`Task complete: +${task.rewardCoins} EC, +${task.rewardXp} XP`);
    } catch (error) {
      console.error(error);
      this.alertService.error('Failed to claim task reward.');
    } finally {
      this.loadingTaskId.set(null);
    }
  }

  private loadCompletedTaskIds(): string[] {
    const stored = localStorage.getItem(this.storageKey());

    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as string[];
    } catch {
      localStorage.removeItem(this.storageKey());
      return [];
    }
  }
}
