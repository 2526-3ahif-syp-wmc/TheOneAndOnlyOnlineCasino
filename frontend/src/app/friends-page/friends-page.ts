import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UserService } from '../services/user-service';
import { Friend, FriendsService, PublicUser, FriendRequest } from '../services/friends-service';

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
  friendRequests = signal<FriendRequest[]>([]);
  selectedFriend = signal<Friend | null>(null);
  newFriendUsername = '';
  searchQuery = signal('');
  usersLoading = signal<boolean>(false);
  friendsLoading = signal<boolean>(false);
  requestsLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const currentUser = this.userService.currentUser();

    return this.publicUsers().filter(user => {
      if (currentUser && user.username.toLowerCase() === currentUser.username.toLowerCase()) {
        return false;
      }

      if (this.isAlreadyAdded(user.username)) {
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
    this.loadFriendRequests();
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

  loadFriendRequests(): void {
    const user = this.userService.currentUser();

    if (!user) {
      return;
    }

    this.requestsLoading.set(true);

    this.friendsService.getFriendRequests(user.id)
      .pipe(finalize(() => this.requestsLoading.set(false)))
      .subscribe({
        next: requests => {
          this.friendRequests.set(requests);
        },
        error: () => {
          this.errorMessage.set('Friend requests could not be loaded.');
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

    const exactMatch = users.find(user => user.username.toLowerCase() === query);
    const nextUser = exactMatch ?? users[0];

    this.addFriendByUsername(nextUser.username);
  }

  private addFriendByUsername(username: string): void {
    const user = this.userService.currentUser();
    const normalizedUsername = username.trim();

    if (!user || !normalizedUsername) {
      return;
    }

    this.friendsLoading.set(true);
    this.errorMessage.set('');

    this.friendsService.sendFriendRequest(user.id, normalizedUsername)
      .pipe(finalize(() => this.friendsLoading.set(false)))
      .subscribe({
        next: () => {
          this.newFriendUsername = '';
          this.searchQuery.set('');
          this.errorMessage.set('Friend request sent.');
        },
        error: () => {
          this.errorMessage.set('Request could not be sent.');
        }
      });
  }

  acceptRequest(request: FriendRequest): void {
    this.friendsService.acceptFriendRequest(request.id)
      .subscribe({
        next: () => {
          this.loadFriends();
          this.loadFriendRequests();
          this.errorMessage.set('');
        },
        error: () => {
          this.errorMessage.set('Friend request could not be accepted.');
        }
      });
  }

  declineRequest(request: FriendRequest): void {
    this.friendsService.declineFriendRequest(request.id)
      .subscribe({
        next: () => {
          this.loadFriendRequests();
          this.errorMessage.set('');
        },
        error: () => {
          this.errorMessage.set('Friend request could not be declined.');
        }
      });
  }

  selectFriend(friend: Friend): void {
    this.selectedFriend.set(this.selectedFriend() === friend ? null : friend);
  }

  isSelected(friend: Friend): boolean {
    return this.selectedFriend() === friend;
  }

  addFriend(): void {
    this.addBestMatch();
  }

  removeSelectedFriend(): void {
    const user = this.userService.currentUser();
    const selectedFriend = this.selectedFriend();

    if (!user || !selectedFriend) {
      return;
    }

    this.friendsLoading.set(true);
    this.errorMessage.set('');

    this.friendsService.removeFriend(user.id, selectedFriend.id)
      .pipe(finalize(() => this.friendsLoading.set(false)))
      .subscribe({
        next: () => {
          this.friends.update(friends => friends.filter(friend => friend.id !== selectedFriend.id));
          this.selectedFriend.set(null);
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