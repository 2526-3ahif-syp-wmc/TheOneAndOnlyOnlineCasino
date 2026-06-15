import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.scss',
})
export class FriendsPage {
  friends = signal<Friend[]>([
    {
      id: 1,
      username: 'CasinoKing',
      level: 42,
      totalWins: 523,
      balance: 15420,
      lastActive: '5 minutes ago',
      status: 'online'
    },
    {
      id: 2,
      username: 'LuckyGambler',
      level: 35,
      totalWins: 387,
      balance: 8950,
      lastActive: 'now',
      status: 'gaming'
    },
    {
      id: 3,
      username: 'Slotsmaster',
      level: 28,
      totalWins: 251,
      balance: 5670,
      lastActive: '2 hours ago',
      status: 'offline'
    },
    {
      id: 4,
      username: 'RouletteGuy',
      level: 31,
      totalWins: 412,
      balance: 12300,
      lastActive: '30 minutes ago',
      status: 'online'
    },
    {
      id: 5,
      username: 'MysteryBox',
      level: 24,
      totalWins: 189,
      balance: 3450,
      lastActive: '1 day ago',
      status: 'offline'
    }
  ]);

  selectedFriend = signal<Friend | null>(null);

  selectFriend(friend: Friend) {
    this.selectedFriend.set(this.selectedFriend() === friend ? null : friend);
  }

  isSelected(friend: Friend): boolean {
    return this.selectedFriend() === friend;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
