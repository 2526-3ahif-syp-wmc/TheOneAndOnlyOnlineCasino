import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Friend {
  id: number;
  username: string;
  level: number;
  totalWins: number;
  balance: number;
  lastActive: string;
}

export interface CreateFriendRequest {
  userId: number;
  username: string;
}

export interface PublicUser {
  id: number;
  username: string;
  coins: number;
  premium: number;
  wins: number;
  losses: number;
  xp: number;
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/friends';
  private authApiUrl = 'http://localhost:3000/auth';

  getFriends(userId: number): Observable<Friend[]> {
    return this.httpClient.get<Friend[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getPublicUsers(excludeUserId: number): Observable<PublicUser[]> {
    return this.httpClient.get<PublicUser[]>(`${this.authApiUrl}/users/public?excludeUserId=${excludeUserId}`);
  }

  addFriend(request: CreateFriendRequest): Observable<Friend> {
    return this.httpClient.post<Friend>(this.apiUrl, request);
  }

  removeFriend(userId: number, friendId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${friendId}?userId=${userId}`);
  }
}