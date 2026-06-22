export type FriendStatus = 'online' | 'offline' | 'gaming';

export type FriendRow = {
  id: number;
  user_id: number;
  friend_name: string;
  status: FriendStatus;
  level: number;
  total_wins: number;
  balance: number;
  last_active: string;
  favorite_game: string;
  created_at: string;
  updated_at: string;
  premium: number;
};


export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  status: string;
}

export interface Friend {
  id: number;
  username: string;
  level: number;
  totalWins: number;
  balance: number;
  favoriteGame: string;
  premium: number;
}