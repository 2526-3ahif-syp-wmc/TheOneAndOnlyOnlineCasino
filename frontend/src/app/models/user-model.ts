export type User = {
  id: number;
  username: string;
  coins: number;
  premium: number;
  xp: number;
};

export type UpdateProfileRequest = {
  username: string;
  currentPassword: string;
  newPassword?: string;
};