import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UserService } from '../services/user-service';
import { Friend, FriendsService, PublicUser } from '../services/friends-service';

@Component({
  selector: 'app-friends-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.scss',
})
export class FriendsPage implements OnInit {
  private friendsService = inject(FriendsService);
  private userService = inject(UserService);

  friends = signal<Friend[]>([]);
  publicUsers = signal<PublicUser[]>([]);
  selectedFriend = signal<Friend | null>(null);
  newFriendUsername = '';
  searchQuery = signal('');
  usersLoading = signal<boolean>(false);
  friendsLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const currentUser = this.userService.currentUser();

    return this.publicUsers().filter(user => {
      if (currentUser && user.username.toLowerCase() === currentUser.username.toLowerCase()) {
        return false;
      }

      if (!query) {
        return true;
      }

      return user.username.toLowerCase().includes(query);
    });
  });
  
  ngOnInit(): void {
    this.loadPublicUsers();
    this.loadFriends();
  }

  loadPublicUsers(): void {
    const user = this.userService.currentUser();

    if (!user) {
      this.errorMessage.set('No logged in user found.');
      return;
    }

    this.usersLoading.set(true);

    this.friendsService.getPublicUsers(user.id)
      .pipe(finalize(() => this.usersLoading.set(false)))
      .subscribe({
        next: users => {
          this.publicUsers.set(users);
        },
        error: () => {
          this.errorMessage.set('Saved users could not be loaded.');
        }
      });
  }

  loadFriends(): void {
    const user = this.userService.currentUser();

    if (!user) {
      this.errorMessage.set('No logged in user found.');
      return;
    }

    this.friendsLoading.set(true);
    this.errorMessage.set('');

    this.friendsService.getFriends(user.id)
      .pipe(finalize(() => this.friendsLoading.set(false)))
      .subscribe({
        next: friends => {
          this.friends.set(friends);
          this.selectedFriend.set(null);
        },
        error: () => {
          this.errorMessage.set('Friends konnten nicht geladen werden.');
        }
      });
  }

  isAlreadyAdded(username: string): boolean {
    return this.friends().some(friend => friend.username.toLowerCase() === username.toLowerCase());
  }

  addSuggestedUser(user: PublicUser): void {
    this.addFriendByUsername(user.username);
  }

  addBestMatch(): void {
    const query = this.searchQuery().trim().toLowerCase();
    const users = this.filteredUsers();

    if (!users.length) {
      this.errorMessage.set('No real saved user matches your search.');
      return;
    }

    const exactMatch = users.find(user => user.username.toLowerCase() === query && !this.isAlreadyAdded(user.username));
    const nextUser = exactMatch ?? users.find(user => !this.isAlreadyAdded(user.username));

    if (!nextUser) {
      this.errorMessage.set('All matching users are already in your friends list.');
      return;
    }

    this.addFriendByUsername(nextUser.username);
  }

  private addFriendByUsername(username: string): void {
    const user = this.userService.currentUser();
    const normalizedUsername = username.trim();

    if (!user || !normalizedUsername) return;

    this.friendsLoading.set(true);
    this.errorMessage.set('');

    this.friendsService.addFriend({
      userId: user.id,
      username: normalizedUsername
    })
      .pipe(finalize(() => this.friendsLoading.set(false)))
      .subscribe({
        next: friend => {
          this.friends.update(friends => [...friends, friend]);
          this.selectedFriend.set(friend);
          this.newFriendUsername = '';
          this.searchQuery.set('');
        },
        error: () => {
          this.errorMessage.set('That user does not exist or is already added.');
        }
      });
  }

  selectFriend(friend: Friend) {
    this.selectedFriend.set(this.selectedFriend() === friend ? null : friend);
  }

  isSelected(friend: Friend): boolean {
    return this.selectedFriend() === friend;
  }

  addFriend() {
    this.addBestMatch();
  }

  removeSelectedFriend(): void {
    const user = this.userService.currentUser();
    const selectedFriend = this.selectedFriend();

    if (!user || !selectedFriend) return;

    this.friendsLoading.set(true);
    this.errorMessage.set('');

    this.friendsService.removeFriend(user.id, selectedFriend.id)
      .pipe(finalize(() => this.friendsLoading.set(false)))
      .subscribe({
        next: () => {
          this.friends.update(friends => friends.filter(friend => friend.id !== selectedFriend.id));
          this.selectedFriend.set(this.friends()[0] ?? null);
        },
        error: () => {
          this.errorMessage.set('Freund konnte nicht entfernt werden.');
        }
      });
  }

  closeFriendProfile(): void {
  this.selectedFriend.set(null);
}
}
