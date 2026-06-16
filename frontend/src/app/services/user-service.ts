import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

import { UpdateProfileRequest, User } from '../models/user-model';
import {
  getLevelFromXp,
  getXpForLevel,
  getXpForNextLevel,
  getXpPercent,
} from '../utils/level-utils';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  public currentUser = this.currentUserSignal.asReadonly();

  public isLoggedIn = computed(() => this.currentUserSignal() !== null);

  public username = computed(() => this.currentUserSignal()?.username ?? 'User');

  public coins = computed(() => this.currentUserSignal()?.coins ?? 0);

  public premium = computed(() => this.currentUserSignal()?.premium ?? 0);

  public xp = computed(() => this.currentUserSignal()?.xp ?? 0);

  public level = computed(() => getLevelFromXp(this.xp()));

  public currentLevelXp = computed(() => getXpForLevel(this.level()));

  public nextLevelXp = computed(() => getXpForNextLevel(this.level()));

  public xpProgress = computed(() => {
    return this.xp() - this.currentLevelXp();
  });

  public xpNeeded = computed(() => {
    return this.nextLevelXp() - this.currentLevelXp();
  });

  public xpPercent = computed(() => {
    return getXpPercent(this.xpProgress(), this.xpNeeded());
  });

  public logIn(username: string, password: string) {
    return this.httpClient
      .post<User>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(tap((user) => this.saveUser(user)));
  }

  public register(username: string, password: string) {
    return this.httpClient.post<User>(`${this.apiUrl}/users`, {
      username,
      password,
    });
  }

  public updateProfile(request: UpdateProfileRequest) {
    const user = this.getLoggedInUser();

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}`, request)
      .pipe(tap((updatedUser) => this.saveUser(updatedUser)));
  }

  public updateCoins(coins: number) {
    const user = this.getLoggedInUser();

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/coins`, {
        coins,
      })
      .pipe(tap((updatedUser) => this.saveUser(updatedUser)));
  }

  public decreaseCoins(amount: number) {
    const user = this.getLoggedInUser();
    const newCoins = user.coins - amount;

    if (newCoins < 0) {
      throw new Error('Not enough coins');
    }

    return this.updateCoins(newCoins);
  }

  public updateXp(xp: number) {
    const user = this.getLoggedInUser();

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/xp`, {
        xp,
      })
      .pipe(tap((updatedUser) => this.saveUser(updatedUser)));
  }

  public addXp(amount: number) {
    return this.updateXp(this.xp() + amount);
  }

  public buyPremium() {
    const user = this.getLoggedInUser();

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/premium`, {
        premium: 1,
      })
      .pipe(tap((updatedUser) => this.saveUser(updatedUser)));
  }

  public unbuyPremium() {
    const user = this.getLoggedInUser();

    return this.httpClient
      .patch<User>(`${this.apiUrl}/users/${user.id}/premium`, {
        premium: 0,
      })
      .pipe(tap((updatedUser) => this.saveUser(updatedUser)));
  }

  public logOut(): void {
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
  }

  private getLoggedInUser(): User {
    const user = this.currentUserSignal();

    if (!user) {
      throw new Error('No user logged in');
    }

    return user;
  }

  private saveUser(user: User): void {
    const safeUser: User = {
      ...user,
      xp: user.xp ?? 0,
    };

    localStorage.setItem('user', JSON.stringify(safeUser));
    this.currentUserSignal.set(safeUser);
  }

  private loadUserFromStorage(): User | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(user) as User;

      return {
        ...parsedUser,
        xp: parsedUser.xp ?? 0,
      };
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }
}
