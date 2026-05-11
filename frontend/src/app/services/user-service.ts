import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { User } from '../models/user-model';

export type UpdateProfileRequest = {
  username: string;
  currentPassword: string;
  newPassword?: string;
};

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  private currentUserSignal = signal<User | null>(
    this.loadUserFromStorage()
  );

  public currentUser = this.currentUserSignal.asReadonly();

  public isLoggedIn = computed(() => this.currentUserSignal() !== null);

  public username = computed(() => this.currentUserSignal()?.username ?? 'User');

  public coins = computed(() => this.currentUserSignal()?.coins ?? 0);

  public premium = computed(() => this.currentUserSignal()?.premium ?? 0);

  public xp = computed(() => this.currentUserSignal()?.xp ?? 0);

  public level = computed(() => {
    return this.getLevelFromXp(this.xp());
  });

  public currentLevelXp = computed(() => {
    return this.getXpForLevel(this.level());
  });

  public nextLevelXp = computed(() => {
    return this.getXpForNextLevel(this.level());
  });

  public xpProgress = computed(() => {
    return this.xp() - this.currentLevelXp();
  });

  public xpNeeded = computed(() => {
    return this.nextLevelXp() - this.currentLevelXp();
  });

  public xpPercent = computed(() => {
    const needed = this.xpNeeded();

    if (needed <= 0) {
      return 100;
    }

    return Math.min(100, Math.round((this.xpProgress() / needed) * 100));
  });

  public logIn(username: string, password: string) {
    return this.httpClient
      .post<User>(`${this.apiUrl}/login`, {
        username,
        password
      })
      .pipe(
        tap(user => {
          this.saveUser(user);
        })
      );
  }

  public register(username: string, password: string) {
    return this.httpClient.post<User>(`${this.apiUrl}/users`, {
      username,
      password,
    });
  }

  public updateProfile(request: UpdateProfileRequest) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}`, request)
      .pipe(
        tap(updatedUser => {
          this.saveUser(updatedUser);
        })
      );
  }

  public updateCoins(coins: number) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/coins`, {
        coins
      })
      .pipe(
        tap(updatedUser => {
          this.saveUser(updatedUser);
        })
      );
  }

  public addCoins(amount: number) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    const newCoins = user.coins + amount;

    return this.updateCoins(newCoins);
  }

  public decreaseCoins(amount: number) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    const newCoins = user.coins - amount;

    if (newCoins < 0) {
      throw new Error('Not enough coins');
    }

    return this.updateCoins(newCoins);
  }

  public updateXp(xp: number) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/xp`, {
        xp
      })
      .pipe(
        tap(updatedUser => {
          this.saveUser(updatedUser);
        })
      );
  }

  public addXp(amount: number) {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    const newXp = user.xp + amount;

    return this.updateXp(newXp);
  }

  public buyPremium() {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/premium`, {
        premium: 1
      })
      .pipe(
        tap(updatedUser => {
          this.saveUser(updatedUser);
        })
      );
  }

  public unbuyPremium() {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/premium`, {
        premium: 0
      })
      .pipe(
        tap(updatedUser => {
          this.saveUser(updatedUser);
        })
      );
  }

  public getLeaderboard(type: 'wins' | 'losses', period: string = 'all') {
    return this.httpClient.get<User[]>(
      `${this.apiUrl}/leaderboard?type=${type}&period=${period}`
    );
  }

  public getTopPlayers() {
    return this.httpClient.get<User[]>(`${this.apiUrl}/top-players`);
  }

  public logOut() {
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
  }

  private saveUser(user: User): void {
    const safeUser: User = {
      ...user,
      xp: user.xp ?? 0
    };

    localStorage.setItem('user', JSON.stringify(safeUser));
    this.currentUserSignal.set(safeUser);
  }

  private loadUserFromStorage(): User | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    const parsedUser = JSON.parse(user) as User;

    return {
      ...parsedUser,
      xp: parsedUser.xp ?? 0
    };
  }

  private getLevelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private getXpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  private getXpForNextLevel(level: number): number {
    return Math.pow(level, 2) * 100;
  }
}