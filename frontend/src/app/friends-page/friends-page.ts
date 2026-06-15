import { Component, signal } from '@angular/core';
import { CommonModule, FormsModule } from '@angular/common';

interface Friend {
  id: number;
  username: string;
  level: number;
  totalWins: number;
  balance: number;
  lastActive: string;
  status: 'online' | 'offline' | 'gaming';
}

@Component({
  selector: 'app-friends-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.scss',
})
export class FriendsPage {
  friends = signal<Friend[]>([]);
  selectedFriend = signal<Friend | null>(null);
  newFriendUsername = signal<string>('');
  
  selectFriend(friend: Friend) {
    this.selectedFriend.set(this.selectedFriend() === friend ? null : friend);
  }

  isSelected(friend: Friend): boolean {
    return this.selectedFriend() === friend;
  }

  addFriend() {
    const username = this.newFriendUsername().trim();
    if (!username) return;

    const newFriend: Friend = {
      id: Math.max(0, ...this.friends().map(f => f.id)) + 1,
      username,
      level: Math.floor(Math.random() * 50) + 1,
      totalWins: Math.floor(Math.random() * 500),
      balance: Math.floor(Math.random() * 50000),
      lastActive: 'just added',
      status: 'offline'
    };

    this.friends.update(friends => [...friends, newFriend]);
    this.newFriendUsername.set('');
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
