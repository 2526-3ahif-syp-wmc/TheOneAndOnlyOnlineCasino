export type User = {
  id: number;
  username: string;
  coins: number;
  premium: number;
  wins: number;
  losses: number;
  xp: number;
  avatar_url?: string | null;
};

export type UpdateProfileRequest = {
  username: string;
  currentPassword: string;
  newPassword?: string;
};
