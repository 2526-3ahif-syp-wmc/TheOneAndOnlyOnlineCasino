import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export type User = {
  id: number;
  username: string;
  coins: number;
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

  public logIn(username: string, password: string) {
    return this.httpClient
      .post<User>(`${this.apiUrl}/login`, {
        username,
        password
      })
      .pipe(
        tap(user => {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSignal.set(user);
        })
      );
  }

  public register(username: string, password: string) {
    return this.httpClient.post<User>(`${this.apiUrl}/users`, {
      username,
      password,
    });
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
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSignal.set(updatedUser);
      })
    );
  }

  public logOut() {
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
  }

  private loadUserFromStorage(): User | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  }
}