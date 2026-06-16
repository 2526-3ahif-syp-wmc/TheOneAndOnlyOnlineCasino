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
  avatar_url?: string | null;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  status: string;
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
  avatar_url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private httpClient = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/friends';
  private authApiUrl = 'http://localhost:3000/auth';

  getFriends(userId: number): Observable<Friend[]> {
    return this.httpClient.get<Friend[]>(
      `${this.apiUrl}?userId=${userId}`
    );
  }

  getPublicUsers(excludeUserId: number): Observable<PublicUser[]> {
    return this.httpClient.get<PublicUser[]>(
      `${this.authApiUrl}/users/public?excludeUserId=${excludeUserId}`
    );
  }

  sendFriendRequest(userId: number, username: string): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}/requests`,
      { userId, username }
    );
  }

  getFriendRequests(userId: number): Observable<FriendRequest[]> {
    return this.httpClient.get<FriendRequest[]>(
      `${this.apiUrl}/requests/${userId}`
    );
  }

  acceptFriendRequest(requestId: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}/requests/${requestId}/accept`,
      {}
    );
  }

  declineFriendRequest(requestId: number): Observable<any> {
    return this.httpClient.post(
      `${this.apiUrl}/requests/${requestId}/decline`,
      {}
    );
  }

  removeFriend(userId: number, friendId: number): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.apiUrl}/${friendId}?userId=${userId}`
    );
  }
}